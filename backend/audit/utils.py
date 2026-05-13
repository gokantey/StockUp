from .models import AuditLog
from .middleware import get_current_user, get_current_ip

def log_action(action, model_name, object_id=None, object_repr=None, changes=None, user=None):
    if user is None:
        user = get_current_user()
    
    ip = get_current_ip()
    
    AuditLog.objects.create(
        user=user,
        action=action,
        model_name=model_name,
        object_id=str(object_id) if object_id else None,
        object_repr=object_repr,
        changes=changes,
        ip_address=ip
    )
