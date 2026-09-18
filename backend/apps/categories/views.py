from rest_framework import viewsets, permissions
from apps.categories.models import Category
from apps.categories.serializers import CategorySerializer
from apps.accounts.permissions import IsManagerOrAbove

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsManagerOrAbove()]
