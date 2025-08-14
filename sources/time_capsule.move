module time_capsule_addr::time_capsule {
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::timestamp;
    use aptos_framework::account;
    use aptos_framework::event;
    use aptos_std::table::{Self, Table};

    /// Error codes
    const E_NOT_INITIALIZED: u64 = 1;
    const E_CAPSULE_NOT_FOUND: u64 = 2;
    const E_CAPSULE_LOCKED: u64 = 3;
    const E_UNAUTHORIZED: u64 = 4;
    const E_INVALID_UNLOCK_TIME: u64 = 5;

    /// Time capsule structure
    struct TimeCapsule has store, copy, drop {
        id: u64,
        creator: address,
        title: String,
        message: String,
        created_at: u64,
        unlock_time: u64,
        is_opened: bool,
        recipient: address,
    }

    /// Resource to store all time capsules
    struct TimeCapsuleStore has key {
        capsules: Table<u64, TimeCapsule>,
        next_id: u64,
    }

    /// Events
    #[event]
    struct CapsuleCreated has drop, store {
        id: u64,
        creator: address,
        title: String,
        unlock_time: u64,
        recipient: address,
    }

    #[event]
    struct CapsuleOpened has drop, store {
        id: u64,
        opener: address,
        opened_at: u64,
    }

    /// Initialize the time capsule store
    public entry fun initialize(account: &signer) {
        let account_addr = account::address_of(account);
        if (!exists<TimeCapsuleStore>(account_addr)) {
            move_to(account, TimeCapsuleStore {
                capsules: table::new(),
                next_id: 1,
            });
        };
    }

    /// Create a new time capsule
    public entry fun create_capsule(
        creator: &signer,
        title: String,
        message: String,
        unlock_time: u64,
        recipient: address,
    ) acquires TimeCapsuleStore {
        let creator_addr = account::address_of(creator);
        
        // Ensure the store is initialized
        if (!exists<TimeCapsuleStore>(creator_addr)) {
            initialize(creator);
        };

        let store = borrow_global_mut<TimeCapsuleStore>(creator_addr);
        let current_time = timestamp::now_seconds();
        
        // Validate unlock time is in the future
        assert!(unlock_time > current_time, E_INVALID_UNLOCK_TIME);

        let capsule = TimeCapsule {
            id: store.next_id,
            creator: creator_addr,
            title,
            message,
            created_at: current_time,
            unlock_time,
            is_opened: false,
            recipient,
        };

        table::add(&mut store.capsules, store.next_id, capsule);

        // Emit event
        event::emit(CapsuleCreated {
            id: store.next_id,
            creator: creator_addr,
            title: capsule.title,
            unlock_time,
            recipient,
        });

        store.next_id = store.next_id + 1;
    }

    /// Open a time capsule (if unlocked)
    public entry fun open_capsule(
        opener: &signer,
        creator_addr: address,
        capsule_id: u64,
    ) acquires TimeCapsuleStore {
        let opener_addr = account::address_of(opener);
        assert!(exists<TimeCapsuleStore>(creator_addr), E_NOT_INITIALIZED);
        
        let store = borrow_global_mut<TimeCapsuleStore>(creator_addr);
        assert!(table::contains(&store.capsules, capsule_id), E_CAPSULE_NOT_FOUND);
        
        let capsule = table::borrow_mut(&mut store.capsules, capsule_id);
        let current_time = timestamp::now_seconds();
        
        // Check if capsule can be opened
        assert!(current_time >= capsule.unlock_time, E_CAPSULE_LOCKED);
        assert!(opener_addr == capsule.recipient || opener_addr == capsule.creator, E_UNAUTHORIZED);
        
        capsule.is_opened = true;

        // Emit event
        event::emit(CapsuleOpened {
            id: capsule_id,
            opener: opener_addr,
            opened_at: current_time,
        });
    }

    /// Get capsule details (view function)
    #[view]
    public fun get_capsule(creator_addr: address, capsule_id: u64): TimeCapsule acquires TimeCapsuleStore {
        assert!(exists<TimeCapsuleStore>(creator_addr), E_NOT_INITIALIZED);
        let store = borrow_global<TimeCapsuleStore>(creator_addr);
        assert!(table::contains(&store.capsules, capsule_id), E_CAPSULE_NOT_FOUND);
        *table::borrow(&store.capsules, capsule_id)
    }

    /// Get all capsule IDs for a creator (view function)
    #[view]
    public fun get_user_capsules(creator_addr: address): vector<u64> acquires TimeCapsuleStore {
        if (!exists<TimeCapsuleStore>(creator_addr)) {
            return vector::empty<u64>()
        };
        
        let store = borrow_global<TimeCapsuleStore>(creator_addr);
        let capsule_ids = vector::empty<u64>();
        let i = 1;
        
        while (i < store.next_id) {
            if (table::contains(&store.capsules, i)) {
                vector::push_back(&mut capsule_ids, i);
            };
            i = i + 1;
        };
        
        capsule_ids
    }

    /// Check if capsule can be opened
    #[view]
    public fun can_open_capsule(creator_addr: address, capsule_id: u64): bool acquires TimeCapsuleStore {
        if (!exists<TimeCapsuleStore>(creator_addr)) {
            return false
        };
        
        let store = borrow_global<TimeCapsuleStore>(creator_addr);
        if (!table::contains(&store.capsules, capsule_id)) {
            return false
        };
        
        let capsule = table::borrow(&store.capsules, capsule_id);
        let current_time = timestamp::now_seconds();
        
        current_time >= capsule.unlock_time && !capsule.is_opened
    }
}
