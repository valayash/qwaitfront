#!/usr/bin/env python
"""
Script to migrate the old views.py to the new modular structure.

This script will:
1. Backup the original views.py file
2. Check for any views in views.py that haven't been migrated yet
3. Optionally migrate those views to the appropriate new files
"""

import os
import re
import sys
import shutil
import datetime

# Base directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Original views.py file
ORIGINAL_VIEWS = os.path.join(BASE_DIR, 'views.py')

# New views directory
VIEWS_DIR = os.path.join(BASE_DIR, 'views')

# View modules
VIEW_MODULES = [
    'base_views.py',
    'waitlist_views.py',
    'reservation_views.py',
    'api_views.py',
    'customer_views.py',
    'utility_views.py',
]

def backup_original_views():
    """Create a backup of the original views.py file."""
    if not os.path.exists(ORIGINAL_VIEWS):
        print(f"Error: {ORIGINAL_VIEWS} does not exist.")
        return False
    
    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    backup_path = f"{ORIGINAL_VIEWS}.{timestamp}.bak"
    
    try:
        shutil.copy2(ORIGINAL_VIEWS, backup_path)
        print(f"Backed up {ORIGINAL_VIEWS} to {backup_path}")
        return True
    except Exception as e:
        print(f"Error backing up {ORIGINAL_VIEWS}: {e}")
        return False

def get_function_names_from_file(filepath):
    """Extract function names from a Python file."""
    if not os.path.exists(filepath):
        return []
    
    function_names = []
    
    with open(filepath, 'r') as f:
        content = f.read()
        
    # Find function definitions
    pattern = r'def\s+([a-zA-Z0-9_]+)\s*\('
    matches = re.finditer(pattern, content)
    
    for match in matches:
        function_names.append(match.group(1))
    
    return function_names

def get_all_migrated_functions():
    """Get a list of all functions that have been migrated to the new structure."""
    migrated_functions = []
    
    for module in VIEW_MODULES:
        module_path = os.path.join(VIEWS_DIR, module)
        if os.path.exists(module_path):
            migrated_functions.extend(get_function_names_from_file(module_path))
    
    return migrated_functions

def get_unmigrated_functions():
    """Get a list of functions in the original views.py that haven't been migrated yet."""
    original_functions = get_function_names_from_file(ORIGINAL_VIEWS)
    migrated_functions = get_all_migrated_functions()
    
    unmigrated = []
    for func in original_functions:
        if func not in migrated_functions:
            unmigrated.append(func)
    
    return unmigrated

def extract_function_code(function_name):
    """Extract a function's code from the original views.py file."""
    with open(ORIGINAL_VIEWS, 'r') as f:
        content = f.read()
    
    # Pattern to match function definition and its body
    pattern = rf'(def\s+{function_name}\s*\([^)]*\):.*?)(?=\n\w+\s+\w+|$)'
    match = re.search(pattern, content, re.DOTALL)
    
    if match:
        return match.group(1)
    return None

def get_module_for_function(function_name):
    """Determine which module a function should go into based on naming conventions."""
    if function_name.startswith('api_'):
        return 'api_views.py'
    elif 'reservation' in function_name:
        return 'reservation_views.py'
    elif any(x in function_name for x in ['queue', 'party', 'waitlist']):
        return 'waitlist_views.py'
    elif any(x in function_name for x in ['customer', 'join', 'scan']):
        return 'customer_views.py'
    elif any(x in function_name for x in ['generate', 'format', 'send', 'analytics']):
        return 'utility_views.py'
    else:
        return 'base_views.py'

def migrate_function(function_name, target_module):
    """Migrate a function from the original views.py to a target module."""
    function_code = extract_function_code(function_name)
    if not function_code:
        print(f"Error: Could not extract code for function {function_name}")
        return False
    
    target_path = os.path.join(VIEWS_DIR, target_module)
    
    # Read the current content of the target module
    if os.path.exists(target_path):
        with open(target_path, 'r') as f:
            current_content = f.read()
    else:
        current_content = ""
    
    # Append the function to the target module
    with open(target_path, 'a') as f:
        # Add a blank line before the function if the file is not empty
        if current_content and not current_content.endswith('\n\n'):
            f.write('\n\n')
            
        f.write(function_code)
        f.write('\n')
    
    print(f"Migrated {function_name} to {target_module}")
    return True

def update_init_file():
    """Update the __init__.py file to import all migrated functions."""
    init_path = os.path.join(VIEWS_DIR, '__init__.py')
    
    imports = {
        'base_views.py': [],
        'waitlist_views.py': [],
        'reservation_views.py': [],
        'api_views.py': [],
        'customer_views.py': [],
        'utility_views.py': [],
    }
    
    # Collect all function names by module
    for module in VIEW_MODULES:
        module_path = os.path.join(VIEWS_DIR, module)
        if os.path.exists(module_path):
            functions = get_function_names_from_file(module_path)
            imports[module].extend(functions)
    
    # Create content for __init__.py
    content = "# Import all views from the modular files\n"
    content += "# This maintains backwards compatibility for existing imports\n\n"
    
    for module, functions in imports.items():
        if not functions:
            continue
            
        module_name = module[:-3]  # Remove .py extension
        content += f"# {module_name.replace('_', ' ').title()}\n"
        content += f"from .{module_name} import (\n"
        
        for func in sorted(functions):
            content += f"    {func},\n"
            
        content += ")\n\n"
    
    # Add __all__ list
    content += "# For simplicity in imports, provide a list of all view functions\n"
    content += "__all__ = [\n"
    
    for module, functions in imports.items():
        if not functions:
            continue
            
        module_name = module[:-3]  # Remove .py extension
        content += f"    # {module_name.replace('_', ' ').title()}\n"
        content += "    "
        
        for i, func in enumerate(sorted(functions)):
            if i > 0 and i % 4 == 0:
                content += "\n    "
            content += f"'{func}', "
            
        content += "\n\n"
        
    content += "]\n"
    
    # Write updated __init__.py
    with open(init_path, 'w') as f:
        f.write(content)
    
    print(f"Updated {init_path} with all migrated functions")
    return True

def main():
    """Main function to run the migration script."""
    print("Starting views.py migration...")
    
    # Check if views directory exists
    if not os.path.exists(VIEWS_DIR):
        print(f"Error: Views directory {VIEWS_DIR} does not exist.")
        print("Please create the views directory and module files first.")
        return 1
    
    # Backup original views.py
    if not backup_original_views():
        return 1
    
    # Get unmigrated functions
    unmigrated = get_unmigrated_functions()
    
    if not unmigrated:
        print("All functions have already been migrated!")
        return 0
    
    print(f"Found {len(unmigrated)} unmigrated functions:")
    for i, func in enumerate(unmigrated):
        print(f"{i+1}. {func}")
    
    # Ask if user wants to migrate functions
    choice = input("\nDo you want to migrate these functions? (y/n): ")
    if choice.lower() != 'y':
        print("Migration aborted.")
        return 0
    
    # Migrate each function
    for func in unmigrated:
        target_module = get_module_for_function(func)
        print(f"Migrating {func} to {target_module}...")
        if not migrate_function(func, target_module):
            print(f"Error migrating {func}. Skipping.")
    
    # Update __init__.py
    update_init_file()
    
    print("Migration completed successfully!")
    return 0

if __name__ == "__main__":
    sys.exit(main()) 