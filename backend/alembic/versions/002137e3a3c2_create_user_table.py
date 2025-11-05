"""create user_table

Revision ID: 002137e3a3c2
Revises: 737e2052a57b
Create Date: 2024-xx-xx xx:xx:xx.xxxxxx

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002137e3a3c2'
down_revision = '737e2052a57b'
branch_labels = None
depends_on = None


def upgrade():
    # Step 1: Add items column as NULLABLE first
    op.add_column('past_order_info', sa.Column('items', sa.JSON(), nullable=True))
    
    # Step 2: Migrate existing data - convert single product orders to JSON array format
    op.execute("""
        UPDATE past_order_info
        SET items = jsonb_build_array(
            jsonb_build_object(
                'pro_id', pro_id,
                'quantity', quantity,
                'price_per_item', total_amount / NULLIF(quantity, 0),
                'item_total', total_amount
            )
        )
        WHERE items IS NULL AND pro_id IS NOT NULL
    """)
    
    # Step 3: For any remaining NULL items (if any), set to empty array or handle differently
    op.execute("""
        UPDATE past_order_info
        SET items = '[]'::jsonb
        WHERE items IS NULL
    """)
    
    # Step 4: Now make the column NOT NULL
    op.alter_column('past_order_info', 'items', nullable=False)
    
    # Step 5: Make status nullable (as per new schema)
    op.alter_column('past_order_info', 'status', nullable=True)
    
    # Step 6: Drop the old columns (pro_id, quantity) and foreign key
    op.drop_constraint('past_order_info_pro_id_fkey', 'past_order_info', type_='foreignkey')
    op.drop_column('past_order_info', 'pro_id')
    op.drop_column('past_order_info', 'quantity')
    
    # Step 7: Drop old tracking table if exists
    op.drop_index('ix_order_tracking_status_track_id', table_name='order_tracking_status', if_exists=True)
    op.drop_table('order_tracking_status', if_exists=True)


def downgrade():
    # Recreate old structure
    op.add_column('past_order_info', sa.Column('quantity', sa.INTEGER(), nullable=True))
    op.add_column('past_order_info', sa.Column('pro_id', sa.VARCHAR(), nullable=True))
    
    # Restore data from items JSON (take first item only)
    op.execute("""
        UPDATE past_order_info
        SET 
            pro_id = items->0->>'pro_id',
            quantity = (items->0->>'quantity')::integer
        WHERE items IS NOT NULL AND jsonb_array_length(items) > 0
    """)
    
    op.create_foreign_key('past_order_info_pro_id_fkey', 'past_order_info', 'product_info', ['pro_id'], ['pro_id'])
    op.alter_column('past_order_info', 'status', nullable=False)
    op.drop_column('past_order_info', 'items')
    
    # Recreate tracking table if needed
    # op.create_table('order_tracking_status', ...)