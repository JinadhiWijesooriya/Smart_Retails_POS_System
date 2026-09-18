import os
apps = ['accounts', 'categories', 'suppliers', 'products', 'inventory', 'customers', 'sales', 'purchases', 'reports', 'audit']
for app in apps:
    class_name = app.capitalize() + 'Config'
    content = f"""from django.apps import AppConfig

class {class_name}(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.{app}'
"""
    with open(f"backend/apps/{app}/apps.py", "w") as f:
        f.write(content)
print("Done creating apps.py files")
