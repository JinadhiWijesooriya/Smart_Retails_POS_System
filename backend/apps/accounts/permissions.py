from rest_framework import permissions

class IsSuperAdminOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        role_name = getattr(request.user.role, 'name', '')
        return role_name in ['Super Admin', 'Admin']

class IsManagerOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        role_name = getattr(request.user.role, 'name', '')
        return role_name in ['Super Admin', 'Admin', 'Manager']

class CanAccessPOS(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return True # Authenticated staff can access POS
