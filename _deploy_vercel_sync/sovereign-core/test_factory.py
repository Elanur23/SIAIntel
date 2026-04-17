"""
Factory Test Script
Tests the factory with a single cycle
"""

import logging
from factory import Factory

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(levelname)s] - %(message)s'
)

def main():
    print("\n" + "="*60)
    print("🧪 FACTORY TEST - Single Cycle")
    print("="*60 + "\n")
    
    try:
        # Initialize factory
        factory = Factory()
        
        # Run single cycle
        factory.run_cycle()
        
        print("\n" + "="*60)
        print("✅ TEST COMPLETED SUCCESSFULLY")
        print("="*60 + "\n")
        
    except KeyboardInterrupt:
        print("\n⚠️  Test interrupted by user")
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        raise

if __name__ == '__main__':
    main()
