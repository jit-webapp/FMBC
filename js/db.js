// ไฟล์: js/db.js
// จัดการ IndexedDB - ฐานข้อมูลในเครื่อง

// ========================================
// INITIALIZE DATABASE
// ========================================
    function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("IndexedDB error:", event.target.error);
                reject('Error opening database');
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const tx = event.target.transaction;
                
                console.log(`Upgrading DB from version ${event.oldVersion} to ${event.newVersion}`);

                // --- V1: Transactions & Categories ---
                if (event.oldVersion < 1) {
                    // Store: Transactions
                    if (!db.objectStoreNames.contains(STORE_TRANSACTIONS)) {
                        const txStore = db.createObjectStore(STORE_TRANSACTIONS, { keyPath: 'id' });
                        txStore.createIndex('date', 'date', { unique: false });
                    }
                    // Store: Categories
                    if (!db.objectStoreNames.contains(STORE_CATEGORIES)) {
                        db.createObjectStore(STORE_CATEGORIES, { keyPath: 'type' });
                    }
                }

                // --- V2: Frequent Items & Config ---
                if (event.oldVersion < 2) {
                    if (!db.objectStoreNames.contains(STORE_FREQUENT_ITEMS)) {
                        const freqStore = db.createObjectStore(STORE_FREQUENT_ITEMS, { keyPath: 'name' });
                        freqStore.createIndex('count', 'count', { unique: false });
                    }
                    if (!db.objectStoreNames.contains(STORE_CONFIG)) {
                        db.createObjectStore(STORE_CONFIG, { keyPath: 'key' });
                    }
                }

                // --- V3: Multi-Account Support ---
                if (event.oldVersion < 3) {
                    if (!db.objectStoreNames.contains(STORE_ACCOUNTS)) {
                        const accStore = db.createObjectStore(STORE_ACCOUNTS, { keyPath: 'id' });
                        // สร้างบัญชีเริ่มต้น (Cash) ถ้ายังไม่มี
                        accStore.transaction.oncomplete = () => {
                            const accTx = db.transaction(STORE_ACCOUNTS, 'readwrite').objectStore(STORE_ACCOUNTS);
                            accTx.add({ id: 'acc_cash', name: 'เงินสด', balance: 0, icon: 'fa-wallet', color: 'bg-green-500' });
                        };
                    }
                    // เพิ่ม accountId ให้ transaction เก่าๆ (Migration)
                    if (db.objectStoreNames.contains(STORE_TRANSACTIONS)) {
                        const store = tx.objectStore(STORE_TRANSACTIONS);
                        store.openCursor().onsuccess = (e) => {
                            const cursor = e.target.result;
                            if (cursor) {
                                const data = cursor.value;
                                if (!data.accountId) {
                                    data.accountId = 'acc_cash';
                                    cursor.update(data);
                                }
                                cursor.continue();
                            }
                        };
                    }
                }

                // --- V4: Auto Complete Data ---
                if (event.oldVersion < 4) {
                    if (!db.objectStoreNames.contains(STORE_AUTO_COMPLETE)) {
                        db.createObjectStore(STORE_AUTO_COMPLETE, { keyPath: 'id' });
                    }
                }

                // --- V5: Recurring Transactions (ใหม่!) ---
                if (event.oldVersion < 5) {
                    if (!db.objectStoreNames.contains(STORE_RECURRING)) {
                        // สร้าง Store เก็บกฎรายการประจำ
                        // id: key หลัก
                        // nextDueDate: เอาไว้ query ว่ารายการไหนถึงกำหนดจ่ายแล้ว
                        const recurringStore = db.createObjectStore(STORE_RECURRING, { keyPath: 'id' });
                        recurringStore.createIndex('nextDueDate', 'nextDueDate', { unique: false });
                    }
                    console.log('IndexedDB Upgrade: Running v5 migration (Added "recurring" store)');
                }
				
				// --- V6: Budgets Feature (NEW) ---
				if (event.oldVersion < 6) {
					if (!db.objectStoreNames.contains(STORE_BUDGETS)) {
						// keyPath เป็น category เพราะ 1 หมวดหมู่มี 1 งบประมาณ
						db.createObjectStore(STORE_BUDGETS, { keyPath: 'category' }); 
					}
					console.log('IndexedDB Upgrade: Running v6 migration (Added "budgets" store)');
				}
				
				// --- V7: Notifications Feature (NEW) ---
				if (event.oldVersion < 7) {
					if (!db.objectStoreNames.contains(STORE_NOTIFICATIONS)) {
						// +++ [เพิ่มตรงนี้] สร้างห้อง notifications +++
					db.createObjectStore(STORE_NOTIFICATIONS, { keyPath: 'id' });
					}
					console.log('IndexedDB Upgrade: Running v6 migration (Added "budgets" store)');
				}
				
				// --- V8: Quick Drafts ---
				if (event.oldVersion < 8) {
					if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
						db.createObjectStore(STORE_DRAFTS, { keyPath: 'id' });
					}
					console.log('IndexedDB Upgrade: Running v8 migration (Added "drafts" store)');
				}
            };

            request.onsuccess = (event) => {
                db = event.target.result;
                console.log("IndexedDB connected successfully");
                resolve(db);
            };
        });
    }


// ========================================
// DATABASE OPERATIONS
// ========================================
    function dbGet(storeName, key) {
        return new Promise((resolve, reject) => {
            if (!db) return reject("DB not initialized");
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    function dbGetAll(storeName) {
        return new Promise((resolve, reject) => {
            if (!db) return reject("DB not initialized");
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    function dbPut(storeName, item) {
        return new Promise((resolve, reject) => {
            if (!db) return reject("DB not initialized");
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(item);
            request.onsuccess = () => resolve(request.result);
			// +++ เพิ่มบรรทัดนี้: บันทึกสำเร็จในเครื่อง ให้ส่งขึ้น Cloud ด้วย +++
            saveToCloud(storeName, item); 
            // +++++++++++++++++++++++++++++++++++++++++++++++++++++++
            request.onerror = (event) => reject(event.target.error);
        });
    }

    function dbDelete(storeName, key) {
        return new Promise((resolve, reject) => {
            if (!db) return reject("DB not initialized");
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            request.onsuccess = () => resolve();
			// +++ เพิ่มบรรทัดนี้: ลบสำเร็จในเครื่อง ให้ลบบน Cloud ด้วย +++
            deleteFromCloud(storeName, key);
            // +++++++++++++++++++++++++++++++++++++++++++++++++++++
            request.onerror = (event) => reject(event.target.error);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    function dbClear(storeName) {
        return new Promise((resolve, reject) => {
            if (!db) return reject("DB not initialized");
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }

    function getSortedAccounts() {
