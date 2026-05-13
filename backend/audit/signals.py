from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.forms.models import model_to_dict
from .utils import log_action
from inventory.models import Product, Category, StockMovement, PurchaseOrder
from sales.models import Sale
import decimal

def get_diff(old_state, new_state):
    changes = {}
    for field, old_val in old_state.items():
        new_val = new_state.get(field)
        if old_val != new_val:
            # Handle decimal/dates conversion for JSON
            changes[field] = {
                'old': str(old_val) if isinstance(old_val, (decimal.Decimal, float)) else old_val,
                'new': str(new_val) if isinstance(new_val, (decimal.Decimal, float)) else new_val
            }
    return changes

@receiver(pre_save, sender=Product)
def product_pre_save(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_obj = sender.objects.get(pk=instance.pk)
            instance._old_state = model_to_dict(old_obj)
        except sender.DoesNotExist:
            instance._old_state = None

@receiver(post_save, sender=Product)
def product_post_save(sender, instance, created, **kwargs):
    action = 'CREATE' if created else 'UPDATE'
    changes = None
    
    if not created and hasattr(instance, '_old_state') and instance._old_state:
        changes = get_diff(instance._old_state, model_to_dict(instance))
        if not changes:
            return

    log_action(
        action=action,
        model_name='Item',
        object_id=instance.id,
        object_repr=instance.name,
        changes=changes
    )

@receiver(post_save, sender=StockMovement)
def stock_movement_post_save(sender, instance, created, **kwargs):
    if created:
        if instance.movement_type == 'ADJ':
            action = 'ADJUST'
        elif instance.movement_type == 'IN':
            action = 'IN'
        elif instance.movement_type == 'OUT':
            action = 'OUT'
        else:
            action = 'CREATE'
            
        log_action(
            action=action,
            model_name='Inventory Change',
            object_id=instance.id,
            object_repr=str(instance),
            changes={'note': instance.note}
        )
    elif instance.is_voided:
        log_action(
            action='VOID',
            model_name='Inventory Change',
            object_id=instance.id,
            object_repr=str(instance),
            changes={'reason': instance.void_reason}
        )

@receiver(post_save, sender=Sale)
def sale_post_save(sender, instance, created, **kwargs):
    if created:
        log_action(
            action='OUT',
            model_name='Sale / Transaction',
            object_id=instance.id,
            object_repr=f"Sale #{instance.id}",
        )
    elif instance.is_voided:
        log_action(
            action='VOID',
            model_name='Sale / Transaction',
            object_id=instance.id,
            object_repr=f"Sale #{instance.id}",
            changes={'reason': instance.void_reason}
        )

@receiver(post_save, sender=PurchaseOrder)
def po_post_save(sender, instance, created, **kwargs):
    action = 'CREATE' if created else 'UPDATE'
    log_action(
        action=action,
        model_name='Purchase Order',
        object_id=instance.id,
        object_repr=instance.po_number,
        changes={'status': instance.status} if not created else None
    )
