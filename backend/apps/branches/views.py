from rest_framework import viewsets, permissions
from apps.branches.models import Branch
from apps.accounts.serializers import BranchSerializer
from apps.accounts.permissions import IsSuperAdminOrAdmin

class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsSuperAdminOrAdmin()]
