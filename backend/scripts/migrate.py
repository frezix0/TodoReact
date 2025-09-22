import os
import sys
import argparse
import subprocess
from pathlib import Path
from typing import List, Optional
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT


class MigrationRunner:  
    def __init__(self, db_config: dict):
        self.db_config = db_config
        self.migrations_dir = Path("migrations")
        self.rollback_dir = Path("migrations/rollback")
    
    def create_database_if_not_exists(self) -> bool:
        try:
            # Connect to postgres database to create user and database
            conn = psycopg2.connect(
                host=self.db_config['host'],
                port=self.db_config['port'],
                database='postgres',
                user='postgres'
            )
            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            cursor = conn.cursor()
            
            # Create user if not exists
            cursor.execute(f"""
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '{self.db_config['user']}') THEN
                        CREATE USER {self.db_config['user']} WITH PASSWORD '{self.db_config['password']}';
                    END IF;
                END
                $$;
            """)
            
            # Create database if not exists
            cursor.execute(f"""
                SELECT 1 FROM pg_database WHERE datname = '{self.db_config['database']}'
            """)
            
            if not cursor.fetchone():
                cursor.execute(f"CREATE DATABASE {self.db_config['database']} OWNER {self.db_config['user']}")
                print(f"✓ Database '{self.db_config['database']}' created")
            else:
                print(f"✓ Database '{self.db_config['database']}' already exists")
            
            # Grant privileges
            cursor.execute(f"GRANT ALL PRIVILEGES ON DATABASE {self.db_config['database']} TO {self.db_config['user']}")
            cursor.execute(f"ALTER USER {self.db_config['user']} CREATEDB")
            
            cursor.close()
            conn.close()
            return True
            
        except Exception as e:
            print(f"✗ Failed to create database: {e}")
            return False
    
    def get_connection(self) -> psycopg2.extensions.connection:
        """Get database connection."""
        return psycopg2.connect(
            host=self.db_config['host'],
            port=self.db_config['port'],
            database=self.db_config['database'],
            user=self.db_config['user'],
            password=self.db_config['password']
        )
    
    def run_sql_file(self, file_path: Path) -> bool:
        """Run SQL file against the database."""
        try:
            conn = self.get_connection()
            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            cursor = conn.cursor()
            
            with open(file_path, 'r') as f:
                sql_content = f.read()
                cursor.execute(sql_content)
            
            cursor.close()
            conn.close()
            return True
            
        except Exception as e:
            print(f"✗ Failed to execute {file_path.name}: {e}")
            return False
    
    def get_migration_files(self) -> List[Path]:
        """Get migration files in order."""
        if not self.migrations_dir.exists():
            print(f"✗ Migrations directory '{self.migrations_dir}' not found")
            return []
        
        files = [f for f in self.migrations_dir.glob("*.sql") if f.is_file()]
        return sorted(files)
    
    def get_rollback_files(self) -> List[Path]:
        """Get rollback files in reverse order."""
        if not self.rollback_dir.exists():
            print(f"✗ Rollback directory '{self.rollback_dir}' not found")
            return []
        
        files = [f for f in self.rollback_dir.glob("*.sql") if f.is_file()]
        return sorted(files, reverse=True)
    
    def run_migrations(self) -> bool:
        """Run all pending migrations."""
        print("Running database migrations...")
        
        migration_files = self.get_migration_files()
        if not migration_files:
            print("✗ No migration files found")
            return False
        
        for migration_file in migration_files:
            print(f"Running migration: {migration_file.name}")
            if self.run_sql_file(migration_file):
                print(f"✓ Migration {migration_file.name} completed")
            else:
                return False
        
        return True
    
    def run_rollbacks(self, target_migration: Optional[str] = None, all_migrations: bool = False) -> bool:
        """Run rollback migrations."""
        rollback_files = self.get_rollback_files()
        if not rollback_files:
            print("✗ No rollback files found")
            return False
        
        if all_migrations:
            print("Rolling back ALL migrations...")
            files_to_run = [f for f in rollback_files if "004_remove_sample_data" not in f.name]
        elif target_migration:
            print(f"Rolling back to migration {target_migration}...")
            target_num = f"{int(target_migration):03d}"
            files_to_run = [
                f for f in rollback_files 
                if f.name.split('_')[0] > target_num
            ]
        else:
            # Default: only remove sample data
            print("Removing sample data...")
            files_to_run = [f for f in rollback_files if "004_remove_sample_data" in f.name]
        
        for rollback_file in files_to_run:
            print(f"Running rollback: {rollback_file.name}")
            if self.run_sql_file(rollback_file):
                print(f"✓ Rollback {rollback_file.name} completed")
            else:
                return False
        
        return True
    
    def test_connection(self) -> bool:
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT 'Connection successful!' as message")
            result = cursor.fetchone()
            print(f"✓ {result[0]}")
            cursor.close()
            conn.close()
            return True
        except Exception as e:
            print(f"✗ Connection test failed: {e}")
            return False


def main():
    """Main function."""
    parser = argparse.ArgumentParser(description="Todo App Database Migration Runner")
    parser.add_argument('--host', default='localhost', help='Database host')
    parser.add_argument('--port', default='5432', help='Database port')
    parser.add_argument('--database', default='todo_db', help='Database name')
    parser.add_argument('--user', default='todo_user', help='Database user')
    parser.add_argument('--password', required=True, help='Database password')
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Setup command
    setup_parser = subparsers.add_parser('setup', help='Setup database and run migrations')
    
    # Migrate command
    migrate_parser = subparsers.add_parser('migrate', help='Run migrations')
    
    # Rollback command
    rollback_parser = subparsers.add_parser('rollback', help='Rollback migrations')
    rollback_parser.add_argument('--target', help='Target migration number')
    rollback_parser.add_argument('--all', action='store_true', help='Rollback all migrations')
    rollback_parser.add_argument('--sample-data', action='store_true', help='Remove only sample data')
    
    # Test command
    test_parser = subparsers.add_parser('test', help='Test database connection')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    db_config = {
        'host': args.host,
        'port': args.port,
        'database': args.database,
        'user': args.user,
        'password': args.password
    }
    
    runner = MigrationRunner(db_config)
    
    if args.command == 'setup':
        print("Setting up Todo Application Database...")
        if runner.create_database_if_not_exists():
            if runner.run_migrations():
                runner.test_connection()
                print("\n✓ Database setup completed successfully!")
                print(f"DATABASE_URL=postgresql://{args.user}:{args.password}@{args.host}:{args.port}/{args.database}")
            else:
                sys.exit(1)
        else:
            sys.exit(1)
    
    elif args.command == 'migrate':
        if runner.run_migrations():
            print("✓ Migrations completed successfully!")
        else:
            sys.exit(1)
    
    elif args.command == 'rollback':
        success = False
        if args.all:
            success = runner.run_rollbacks(all_migrations=True)
        elif args.target:
            success = runner.run_rollbacks(target_migration=args.target)
        elif args.sample_data:
            success = runner.run_rollbacks()
        else:
            print("Please specify --all, --target, or --sample-data")
            sys.exit(1)
        
        if success:
            print("✓ Rollback completed successfully!")
        else:
            sys.exit(1)
    
    elif args.command == 'test':
        if not runner.test_connection():
            sys.exit(1)


if __name__ == '__main__':
    main()