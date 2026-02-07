// ไฟล์: js/firebase.js
// จัดการ Cloud Sync & Authentication ผ่าน Firebase

	// ============================================
    // FIREBASE SYNC FUNCTIONS (แก้ไขใหม่)
    // ============================================
    
    // ฟังก์ชันสำหรับบันทึกขึ้น Cloud (ใช้ document ID เดียวกับ Local DB)
    async function saveToCloud(storeName, item) {
        if (window.auth && window.auth.currentUser && window.db) {
            try {
                const uid = window.auth.currentUser.uid;
                // หา ID ของข้อมูล
                let docId = item.id || item.key || item.name || item.type || item.category;
                
                if (!docId) {
                    console.warn('Skipping cloud save: No ID found for item', item);
                    return;
                }

                const docRef = window.dbDoc(window.db, 'users', uid, storeName, docId);
                await window.dbSetDoc(docRef, item, { merge: true });
                console.log(`Cloud Saved: ${storeName}/${docId}`);

                // +++ แก้ไข: กรองการแจ้งเตือน ไม่ให้แสดงตอนบันทึกค่า Config หรือ AutoComplete +++
                // STORE_CONFIG = การตั้งค่าต่างๆ, STORE_AUTO_COMPLETE = ระบบจำคำ
                const silentStores = ['config', 'autoComplete', 'transactions', 'notifications'];
                
                // เช็คว่า storeName ปัจจุบัน อยู่ในรายการที่ต้องเงียบหรือไม่
                // หมายเหตุ: ใช้ตัวแปร storeName เทียบกับชื่อ Store ที่เรากำหนดไว้ด้านบน
                if (!silentStores.includes(storeName) && storeName !== STORE_CONFIG && storeName !== STORE_AUTO_COMPLETE) {
				    showToast(`☁️ บันทึกข้อมูลขึ้น Cloud แล้ว`, 'success');
                }
                // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

            } catch (err) {
                console.error("Cloud Save Error:", err);
            }
        }
    }

    // ฟังก์ชันสำหรับลบจาก Cloud
    async function deleteFromCloud(storeName, key) {
        if (window.auth && window.auth.currentUser && window.db) {
            try {
                const uid = window.auth.currentUser.uid;
                await window.dbDelete(window.dbDoc(window.db, 'users', uid, storeName, key));
                console.log(`Cloud Deleted: ${storeName}/${key}`);

                // +++ แก้ไข: กรองการแจ้งเตือนเช่นกัน +++
                const silentStores = ['config', 'autoComplete', 'transactions']; 
                if (!silentStores.includes(storeName) && storeName !== STORE_CONFIG && storeName !== STORE_AUTO_COMPLETE) {
                    showToast(`☁️ ลบข้อมูลจาก Cloud แล้ว`, 'success');
                }
                // +++++++++++++++++++++++++++++++++++++++

            } catch (err) {
                console.error("Cloud Delete Error:", err);
            }
        }
    }
	
	// ============================================
	// REAL-TIME NOTIFICATION LISTENER
	// ============================================
	let notifUnsubscribe = null;

	function initNotificationListener() {
		if (!window.auth || !window.auth.currentUser || !window.db) return;
		
		const uid = window.auth.currentUser.uid;

		// ยกเลิกตัวเก่าก่อน (ถ้ามี)
		if (notifUnsubscribe) notifUnsubscribe();

		// ดักฟังเฉพาะการแจ้งเตือนที่ "ยังไม่อ่าน" (isRead: false)
		// หรือถ้าคุณไม่ได้เก็บสถานะ isRead ใน object ก็ดึงมาทั้งหมดตามวันที่
		const colRef = window.dbCollection(window.db, 'users', uid, STORE_NOTIFICATIONS);
		
		// Query: เอาเฉพาะที่ timestamp ไม่เก่าเกินไป หรือเอาสถานะ 'unread'
		// ตัวอย่างนี้ดึงทั้งหมดที่เปลี่ยนแบบ Realtime
		notifUnsubscribe = colRef.onSnapshot(snapshot => {
			let hasChanges = false;
			
			snapshot.docChanges().forEach(change => {
				const data = change.doc.data();
				const docId = change.doc.id;

				if (change.type === "added" || change.type === "modified") {
					// อัปเดตข้อมูลลง Local State (เพื่อให้ข้อมูลตรงกัน)
					const existingIndex = state.notificationHistory.findIndex(n => n.id === docId);
					
					if (existingIndex > -1) {
						state.notificationHistory[existingIndex] = { ...data, id: docId };
					} else {
						state.notificationHistory.unshift({ ...data, id: docId });
						hasChanges = true; // มีของใหม่มา
					}
				}
				
				if (change.type === "removed") {
					state.notificationHistory = state.notificationHistory.filter(n => n.id !== docId);
				}
			});

			// ถ้ามีการเปลี่ยนแปลง ให้รีเฟรชหน้าจอแจ้งเตือน
			if (hasChanges || snapshot.docChanges().length > 0) {
				// บันทึกลง IndexedDB (Local)
				dbPut(STORE_CONFIG, { key: 'notification_history', value: state.notificationHistory });
				
				// เรียกฟังก์ชันแสดงผล (Render) เดิมของคุณ
				if(typeof renderNotificationHistory === 'function') renderNotificationHistory();

				// เช็คว่าต้องเด้ง Modal ไหม (เฉพาะที่มีการแจ้งเตือนใหม่จริงๆ)
				// คุณอาจจะเพิ่ม Logic เช็คว่าถ้าเป็น change.type === "added" ค่อยสั่ง showModal
				const unreadAlerts = state.notificationHistory.filter(n => !n.isRead);
				if (unreadAlerts.length > 0) {
					// เรียกใช้ Modal แจ้งเตือนของคุณ
					const modal = document.getElementById('notification-modal');
					if (modal && modal.classList.contains('hidden')) {
						 // showFullScreenModal(unreadAlerts); // เรียกฟังก์ชันเปิด Modal ของคุณ
						 // หรือถ้าไม่มีฟังก์ชันแยก ก็สั่งเปิดตรงนี้:
						 // modal.classList.remove('hidden'); 
						 // (แต่ต้องระวัง loop เด้งซ้ำตอนเปิดหน้าเว็บครั้งแรก)
					}
				}
			}
		});
	}

	// *** เรียกใช้ฟังก์ชันนี้ตอน Login สำเร็จ ***
	// ใส่ต่อท้ายใน loadDataFromCloud หรือ auth.onAuthStateChanged
	// ตัวอย่าง:
	/*
		auth.onAuthStateChanged(user => {
			if(user) {
				initNotificationListener(); 
			}
		});
	*/

    // ฟังก์ชันโหลดข้อมูลจาก Cloud ลงเครื่อง (เรียกตอน Login)
    // แก้ไขล่าสุด: บังคับ Overwrite (ล้างเครื่องแล้วโหลดใหม่) เสมอ โดยไม่ถาม
    window.loadDataFromCloud = async (uid) => {
        if (!window.db) return;
        
        const collectionsToSync = [
            STORE_TRANSACTIONS, 
            STORE_ACCOUNTS, 
            STORE_CATEGORIES, 
            STORE_FREQUENT_ITEMS, 
            STORE_CONFIG,
            STORE_AUTO_COMPLETE,
            STORE_RECURRING,
            STORE_BUDGETS,
			STORE_NOTIFICATIONS
        ];

        try {
            let hasDownloaded = false;
            let hasUploaded = false;
            
            // --- กำหนดโหมดเป็น 'overwrite' (ทับข้อมูล) เสมอ ---
            // ผลลัพธ์: ข้อมูลเก่าในเครื่องจะถูกลบก่อน แล้วโหลดจาก Cloud มาใส่
            let syncMode = 'overwrite'; 

            // ตรวจสอบข้อมูล Cloud (เพื่อดูว่ามีอะไรต้องโหลดไหม)
            const cloudTxRef = window.dbCollection(window.db, 'users', uid, STORE_TRANSACTIONS);
            const cloudTxSnapshot = await window.dbGetDocs(cloudTxRef);

            for (const storeName of collectionsToSync) {
                let snapshot;
                if (storeName === STORE_TRANSACTIONS) {
                    snapshot = cloudTxSnapshot;
                } else {
                    const colRef = window.dbCollection(window.db, 'users', uid, storeName);
                    snapshot = await window.dbGetDocs(colRef);
                }
                
                if (!snapshot.empty) {
                    // --- กรณี A: บน Cloud มีข้อมูล ---
                    // ให้ล้างข้อมูลในเครื่องทิ้งก่อน (เฉพาะ Store นั้นๆ)
                    if (syncMode === 'overwrite') {
                        await dbClear(storeName); 
                    }
                    
                    const tx = db.transaction([storeName], 'readwrite');
                    const store = tx.objectStore(storeName);
                    
                    snapshot.forEach(doc => {
                        let data = doc.data(); 
                        let isValid = true;    

                        // Validation Logic (ตรวจสอบความถูกต้องของข้อมูล)
                        if (storeName === STORE_BUDGETS) {
                            if (!data.category) data.category = doc.id;
                            if (!data.category) isValid = false;
                        } else if (storeName === STORE_TRANSACTIONS || storeName === STORE_ACCOUNTS || storeName === STORE_RECURRING) {
                            if (!data.id) data.id = doc.id;
                            if (!data.id) isValid = false;
                        } else if (storeName === STORE_CATEGORIES) {
                            if (!data.type) data.type = doc.id;
                            if (!data.type) isValid = false;
                        } else if (storeName === STORE_FREQUENT_ITEMS) {
                            if (!data.name) data.name = doc.id;
                            if (!data.name) isValid = false;
                        } else if (storeName === STORE_CONFIG) {
                            if (!data.key) data.key = doc.id;
                            if (!data.key) isValid = false;
                        }

                        if (isValid) {
                            try {
                                store.put(data);
                            } catch (err) {
                                console.error(`Skipping corrupt record in ${storeName}:`, doc.id, err);
                            }
                        }
                    });
                    
                    await new Promise(resolve => tx.oncomplete = resolve);
                    hasDownloaded = true;
                }
                else {
                    // --- กรณี B: บน Cloud ว่างเปล่า (ผู้ใช้ใหม่ หรือเพิ่งเคลียร์ Cloud) ---
                    // ให้อัปโหลดข้อมูลจากเครื่องขึ้นไปแทน (Backup ครั้งแรก)
                    const localItems = await dbGetAll(storeName);
                    if (localItems.length > 0) {
                        const uploadPromises = localItems.map(item => saveToCloud(storeName, item));
                        await Promise.all(uploadPromises);
                        hasUploaded = true;
                    }
                }
            }
            
            // บันทึกว่าเครื่องนี้ซิงค์กับ User นี้เรียบร้อยแล้ว
            localStorage.setItem('last_sync_uid', uid);

            // โหลดข้อมูลเข้า State ใหม่ และรีเฟรชหน้าจอ
            await loadStateFromDB();
            refreshAllUI();
            
            // แสดง Toast แจ้งเตือน
            if (hasDownloaded) {
                showToast("ดาวน์โหลดข้อมูลจาก Cloud เรียบร้อย!", "success");
            } else if (hasUploaded) {
                showToast("อัปโหลดข้อมูลเริ่มต้นขึ้น Cloud แล้ว!", "success");
            }
        } catch (error) {
            console.error("Sync Error:", error);
            showToast("Sync Error: " + error.message, "error");
        }
    };
	
	// ============================================
    // ฟังก์ชัน: ล้างข้อมูลและรีเซ็ตค่าเริ่มต้นเมื่อ Logout (Factory Reset)
    // ============================================
    window.clearLocalDataForLogout = async () => {
        console.log("Performing Factory Reset for Logout...");
        try {
            // 1. ล้างข้อมูลทุก Store
            await dbClear(STORE_TRANSACTIONS);
            await dbClear(STORE_ACCOUNTS);
            await dbClear(STORE_CATEGORIES);
            await dbClear(STORE_FREQUENT_ITEMS);
            await dbClear(STORE_AUTO_COMPLETE);
            await dbClear(STORE_CONFIG);
			await dbClear(STORE_RECURRING);
			await dbClear(STORE_BUDGETS);

            // 2. สร้างข้อมูลเริ่มต้นใหม่ (Factory Reset)
            return new Promise((resolve, reject) => {
                const tx = db.transaction([STORE_CATEGORIES, STORE_FREQUENT_ITEMS, STORE_CONFIG, STORE_ACCOUNTS], 'readwrite');

                // 2.1 หมวดหมู่
                const catStore = tx.objectStore(STORE_CATEGORIES);
                catStore.add({ type: 'income', items: DEFAULT_CATEGORIES.income });
                catStore.add({ type: 'expense', items: DEFAULT_CATEGORIES.expense });

                // 2.2 รายการใช้บ่อย
                const itemStore = tx.objectStore(STORE_FREQUENT_ITEMS);
                DEFAULT_FREQUENT_ITEMS.forEach(item => itemStore.add({ name: item }));

                // 2.3 Config เริ่มต้น (สำคัญ: ตั้ง password เป็น null)
                const configStore = tx.objectStore(STORE_CONFIG);
                const hashedDefault = CryptoJS.SHA256(DEFAULT_PASSWORD).toString();
				configStore.add({ key: 'password', value: hashedDefault });
                configStore.add({ key: AUTOLOCK_CONFIG_KEY, value: 10 }); 
                configStore.add({ key: DARK_MODE_CONFIG_KEY, value: false }); 
                if (typeof AUTO_CONFIRM_CONFIG_KEY !== 'undefined') {
                    configStore.add({ key: AUTO_CONFIRM_CONFIG_KEY, value: false });
                }

                // 2.4 บัญชีเงินสด
                const accStore = tx.objectStore(STORE_ACCOUNTS);
                const defaultCash = { 
                    id: 'acc-cash-' + Date.now(), 
                    name: 'เงินสด', 
                    type: 'cash', 
                    initialBalance: 0, 
                    icon: 'fa-wallet',
                    iconName: 'fa-wallet', 
                    displayOrder: Date.now() 
                };
                accStore.add(defaultCash);

                tx.oncomplete = () => {
                    resolve(true); // เสร็จสิ้น
                };
                
                tx.onerror = (e) => {
                    console.error("Reset Error", e);
                    resolve(true); // ให้ผ่านไปรีโหลดหน้าได้แม้ error
                };
            });
        } catch (err) {
            console.error(err);
            return false;
        }
    };
	
	// ============================================
    // ฟังก์ชัน: ตรวจสอบรหัสผ่านก่อน Logout (Export ให้ index.html เรียกใช้)
    // ============================================
    window.verifyPasswordForLogout = async () => {
        // ถ้าไม่มีรหัสผ่าน (null) ให้ผ่านได้เลย
        if (!state.password) {
            return true;
        }

        // เรียกใช้ฟังก์ชัน promptForPassword ที่มีอยู่แล้วใน script.js
        // ฟังก์ชันนี้จัดการ UI และ Auto Confirm ให้เสร็จสรรพ
        const isAuthorized = await promptForPassword('ยืนยันรหัสผ่านเพื่อออกจากระบบ');
        return isAuthorized;
    };
