import sqlite3
import os
import time
import re

# Database path
db_path = os.path.join('../../data/RMPData.sqlite')

# Check if database exists
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
else:
    print(f"Database found: {db_path}")

# Connect to the SQLite database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Function to identify columns with "Yes" or "No" values and alter them to TEXT type
def alter_columns_to_text():
    try:
        # Clean up any existing backup tables first
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_old_%';")
        backup_tables = cursor.fetchall()
        for backup_table in backup_tables:
            print(f"Dropping old backup table: {backup_table[0]}")
            cursor.execute(f"DROP TABLE IF EXISTS {backup_table[0]};")
        
        # Query all main tables (exclude backup tables)
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '%_old_%';")
        tables = cursor.fetchall()

        if not tables:
            print("No tables found in the database.")
            return

        # Iterate through all tables
        for table in tables:
            table_name = table[0]
            columns_to_alter = []
            
            # Query the column names and types for each table
            cursor.execute(f"PRAGMA table_info({table_name});")
            columns = cursor.fetchall()

            # First pass: identify which columns need to be altered
            for column in columns:
                column_name = column[1]
                column_type = column[2]

                # Check if the column type is integer or int and might contain "Yes"/"No" values
                if column_type in ["INTEGER", "INT"]:
                    try:
                        # Check if the column contains 'Yes' or 'No' values
                        cursor.execute(f"SELECT DISTINCT {column_name} FROM {table_name} WHERE {column_name} IN ('Yes', 'No') LIMIT 1;")
                        yes_no_values = cursor.fetchall()
                        
                        if yes_no_values:
                            print(f"Found Yes/No values in {table_name}.{column_name}")
                            columns_to_alter.append(column_name)
                    except sqlite3.Error as e:
                        # Skip if there's an error (e.g., table is empty)
                        print(f"Error checking {table_name}.{column_name}: {e}")
                        continue
            
            # If we have columns to alter, recreate the table
            if columns_to_alter:
                print(f"\nProcessing table {table_name} with columns: {', '.join(columns_to_alter)}")
                
                # Create backup table
                backup_table_name = f"{table_name}_backup_{int(time.time())}"
                cursor.execute(f"ALTER TABLE {table_name} RENAME TO {backup_table_name};")
                
                # Get the original table schema
                cursor.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name='{backup_table_name}';")
                original_schema = cursor.fetchone()[0]
                
                # Modify the schema to change INTEGER columns to TEXT for identified columns
                new_schema = original_schema.replace(f"RENAME TO {backup_table_name}", f"")
                new_schema = new_schema.replace(backup_table_name, table_name)
                
                # Replace INTEGER/INT with TEXT for the specific columns that contain Yes/No values
                for col_name in columns_to_alter:
                    pattern = rf'\b{re.escape(col_name)}\s+(INTEGER|INT)\b'
                    new_schema = re.sub(pattern, f'{col_name} TEXT', new_schema, flags=re.IGNORECASE)
                
                # Create the new table with modified schema
                cursor.execute(new_schema)
                
                # Copy data from backup to new table
                cursor.execute(f"INSERT INTO {table_name} SELECT * FROM {backup_table_name};")
                
                # Drop the backup table
                cursor.execute(f"DROP TABLE {backup_table_name};")
                
                print(f"Successfully updated table {table_name} - changed {len(columns_to_alter)} columns to TEXT type")
                
                # Commit after each table to avoid losing progress
                conn.commit()
            
        print("\nAll table alterations completed successfully!")

    except sqlite3.Error as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

# Run the function
alter_columns_to_text()
