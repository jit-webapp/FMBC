// ไฟล์: js/logic.js
// คำนวณ Business Logic (รายการประจำ, งบประมาณ, การแจ้งเตือน)

// ========================================
// MIGRATION & DATA LOADING
// ========================================
    async function runMigration() {
        try {
            const accounts = await dbGetAll(STORE_ACCOUNTS);
            if (accounts.length > 0) {
                return;
            }

            console.log("Running one-time data migration for v2...");
            Swal.fire({
                title: 'กำลังอัปเกรดข้อมูล',
                text: 'โปรดรอสักครู่ ระบบกำลังย้ายข้อมูลเก่าของคุณไปยังระบบบัญชีใหม่...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            const defaultCash = { 
                id: 'acc-cash-' + Date.now(), 
                name: 'เงินสด', 
                type: 'cash', 
                initialBalance: 0,
                icon: 'fa-wallet',
                iconName: 'fa-wallet', 
                displayOrder: Date.now() 
            };
            const defaultCredit = { 
                id: 'acc-credit-' + Date.now(), 
                name: 'บัตรเครดิต (เริ่มต้น)', 
                type: 'credit', 
                initialBalance: 0,
                icon: 'fa-credit-card',
                iconName: 'fa-credit-card', 
                displayOrder: Date.now() + 1 
            };
            await dbPut(STORE_ACCOUNTS, defaultCash);
            await dbPut(STORE_ACCOUNTS, defaultCredit);

            const transactions = await dbGetAll(STORE_TRANSACTIONS);
            const updatePromises = [];
            let migratedCount = 0;
            for (const tx of transactions) {
                if (tx.accountId) {
                    continue;
                }
                if (tx.isNonDeductible === true) {
                    tx.accountId = defaultCredit.id;
                } else {
                    tx.accountId = defaultCash.id;
                }
                delete tx.isNonDeductible;
                updatePromises.push(dbPut(STORE_TRANSACTIONS, tx));
                migratedCount++;
            }

            await Promise.all(updatePromises);
            Swal.close();

        } catch (err) {
            console.error("Migration failed:", err);
            Swal.fire({
                title: 'อัปเกรดข้อมูลล้มเหลว', 
                text: 'ไม่สามารถย้ายข้อมูลเก่าได้: ' + err.message, 
                icon: 'error',
                customClass: { popup: state.isDarkMode ? 'swal2-popup' : '' },
                background: state.isDarkMode ? '#1a1a1a' : '#fff',
                color: state.isDarkMode ? '#e5e7eb' : '#545454',
            });
        }
    }



// ========================================
// ACCOUNT UTILITIES
// ========================================
    function getSortedAccounts() {
        return [...state.accounts].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    }


// ========================================
// ACCOUNT DETAIL MODAL FUNCTIONS
// ========================================
    function updateAccountDetailControls() {
        const getEl = (id) => document.getElementById(id);
        const viewMode = accountDetailState.viewMode;
        const currentDate = accountDetailState.currentDate;
        
        getEl('acc-detail-view-mode-select').value = viewMode;
        
        if (viewMode === 'all') {
            getEl('acc-detail-month-controls').classList.add('hidden');
            getEl('acc-detail-year-controls').classList.add('hidden');
            getEl('acc-detail-month-controls').classList.remove('flex');
            getEl('acc-detail-year-controls').classList.remove('flex');
        } else if (viewMode === 'month') {
            getEl('acc-detail-month-controls').classList.remove('hidden');
            getEl('acc-detail-month-controls').classList.add('flex');
            getEl('acc-detail-year-controls').classList.add('hidden');
            getEl('acc-detail-year-controls').classList.remove('flex');
            
            const monthYear = currentDate.slice(0, 7);
            getEl('acc-detail-month-picker').value = monthYear;
        } else { 
            getEl('acc-detail-month-controls').classList.add('hidden');
            getEl('acc-detail-month-controls').classList.remove('flex');
            getEl('acc-detail-year-controls').classList.remove('hidden');
            getEl('acc-detail-year-controls').classList.add('flex');
            
            const year = currentDate.slice(0, 4);
            getEl('acc-detail-year-picker').value = year;
        }
    }

    function handleAccountDetailViewModeChange(e) {
        const newMode = e.target.value;
        accountDetailState.viewMode = newMode;
        accountDetailState.currentDate = new Date().toISOString().slice(0, 10); 
        
        updateAccountDetailControls();
        renderAccountDetailList(accountDetailState.accountId);
    }

    function handleAccountDetailDateChange(e, mode) {
        let newDate;
        
        if (mode === 'month') {
            const [year, month] = e.target.value.split('-');
            if (year && month) {
                newDate = `${year}-${month}-01`;
            }
        } else { // mode === 'year'
            const year = e.target.value;
            if (year && year.length === 4) {
                newDate = `${year}-01-01`;
            }
        }

        if (newDate) {
            accountDetailState.currentDate = newDate;
            renderAccountDetailList(accountDetailState.accountId);
        }
    }

    function navigateAccountDetailPeriod(direction, mode) {
        let dateStr = accountDetailState.currentDate;
        let date = new Date(dateStr);
        
        if (mode === 'month') {
            date.setMonth(date.getMonth() + direction);
        } else { // mode === 'year'
            date.setFullYear(date.getFullYear() + direction);
        }
        
        accountDetailState.currentDate = date.toISOString().slice(0, 10);
        
        updateAccountDetailControls();
        renderAccountDetailList(accountDetailState.accountId);
    }

    // *** NEW HELPER FUNCTION: รีเฟรช Modal ถ้าเปิดอยู่ ***
    async function refreshAccountDetailModalIfOpen() {
        const modal = document.getElementById('account-detail-modal');
        if (!modal.classList.contains('hidden') && accountDetailState.accountId) {
            await renderAccountDetailList(accountDetailState.accountId);
        }
    }
    // ***************************************************************


    async function loadStateFromDB() {


// ========================================
// LOAD STATE FROM DATABASE
// ========================================
    async function loadStateFromDB() {
        try {
			
			// โหลด Biometric ID จาก LocalStorage (เฉพาะเครื่องนี้)
            const localBioId = localStorage.getItem('local_biometric_id');
            if (localBioId) {
                state.biometricId = localBioId;
            }
            // [เดิม] 1. โหลด Accounts และซ่อมแซมข้อมูล (Migration for DisplayOrder/Icon)
            state.accounts = await dbGetAll(STORE_ACCOUNTS);
            let updateOrderPromises = [];
            let hasUndefinedOrder = false;
            
            state.accounts.forEach((acc, index) => {
                // เช็คลำดับการแสดงผล
                if (acc.displayOrder === undefined || acc.displayOrder === null) {
                    acc.displayOrder = Date.now() + index; 
                    updateOrderPromises.push(dbPut(STORE_ACCOUNTS, acc));
                    hasUndefinedOrder = true;
                }
                // เช็คไอคอน
                if (acc.iconName === undefined) {
                    acc.iconName = acc.icon || 'fa-wallet'; 
                    updateOrderPromises.push(dbPut(STORE_ACCOUNTS, acc));
                    hasUndefinedOrder = true;
                }
            });
            
            if (hasUndefinedOrder) {
                console.log('Running one-time migration for account displayOrder/iconName...');
                await Promise.all(updateOrderPromises);
                state.accounts = await dbGetAll(STORE_ACCOUNTS); // โหลดใหม่อีกครั้งหลังแก้เสร็จ
            }
            
            // [เดิม] 2. โหลด Transactions
            state.transactions = await dbGetAll(STORE_TRANSACTIONS);
            // เรียงลำดับวันที่ใหม่สุดขึ้นก่อน
            state.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
			
            // [เดิม] 3. โหลด Categories
            const incomeCats = await dbGet(STORE_CATEGORIES, 'income');
            const expenseCats = await dbGet(STORE_CATEGORIES, 'expense');
            state.categories.income = incomeCats ? incomeCats.items : [...DEFAULT_CATEGORIES.income];
            state.categories.expense = expenseCats ? expenseCats.items : [...DEFAULT_CATEGORIES.expense];

            // [เดิม] 4. โหลด Frequent Items
            const frequentItems = await dbGetAll(STORE_FREQUENT_ITEMS);
            state.frequentItems = frequentItems.map(item => item.name);
            
            // [เดิม] 5. โหลด Auto Complete
            state.autoCompleteList = await dbGetAll(STORE_AUTO_COMPLETE);
            
            // [เดิม] 6. โหลด Password และ Config พื้นฐาน
            const passwordConfig = await dbGet(STORE_CONFIG, 'password');
            let storedPassword;

            if (passwordConfig) {
                storedPassword = passwordConfig.value;
            } else {
                // ถ้าไม่มี ให้สร้าง Default
                const hashedPassword = CryptoJS.SHA256(DEFAULT_PASSWORD).toString();
                await dbPut(STORE_CONFIG, { key: 'password', value: hashedPassword });
                state.password = hashedPassword;
                storedPassword = hashedPassword;
            }

            // Migration: เช็คความยาว Hash (เผื่อมีการเปลี่ยนอัลกอริทึมในอนาคต หรือแก้ข้อมูลผิดพลาด)
            if (storedPassword && typeof storedPassword === 'string' && storedPassword.length !== 64) {
                const newlyHashed = CryptoJS.SHA256(storedPassword).toString();
                await dbPut(STORE_CONFIG, { key: 'password', value: newlyHashed });
                state.password = newlyHashed;
            } else {
                state.password = storedPassword;
            }

            // [เดิม] 7. กำหนดวันและค่า Default ต่างๆ ของ State
            const now = new Date();
			const year = now.getFullYear();
			const month = String(now.getMonth() + 1).padStart(2, '0'); // เดือนเริ่มนับที่ 0 เลยต้อง +1
			const day = String(now.getDate()).padStart(2, '0');
			const today = `${year}-${month}-${day}`;
            state.homeCurrentDate = today; 
            state.listCurrentDate = today; 
            state.calendarCurrentDate = today;
            state.homeViewMode = 'month';
            state.listViewMode = 'all';
            state.homeCurrentPage = 1;
            state.homeItemsPerPage = 10;
            state.listCurrentPage = 1;
            state.listItemsPerPage = 10; 
            
            // [เดิม] 8. โหลดการตั้งค่าการยุบเมนู (Collapse)
            const defaultCollapseSettings = {
                'settings-accounts-content': true,
                'settings-income-content': true,
                'settings-expense-content': true,
                'settings-manual-content': true,
                'home-accounts-content': true,
                'home-transactions-content': true,
                'settings-line-content': true
            };
            const collapseConfig = await dbGet(STORE_CONFIG, 'collapse_preferences');
            if (collapseConfig && collapseConfig.value) {
                state.settingsCollapse = { ...defaultCollapseSettings, ...collapseConfig.value };
            } else {
                state.settingsCollapse = defaultCollapseSettings;
            }
            
            // [เดิม] 9. โหลด Config ย่อยอื่นๆ
            const showBalanceConfig = await dbGet(STORE_CONFIG, 'showBalanceCard');
            state.showBalanceCard = showBalanceConfig ? showBalanceConfig.value : false;

            const autoLockConfig = await dbGet(STORE_CONFIG, AUTOLOCK_CONFIG_KEY);
            state.autoLockTimeout = autoLockConfig ? autoLockConfig.value : 0;
            
            const darkModeConfig = await dbGet(STORE_CONFIG, DARK_MODE_CONFIG_KEY);
            state.isDarkMode = darkModeConfig ? darkModeConfig.value : false;

            const autoConfirmConfig = await dbGet(STORE_CONFIG, AUTO_CONFIRM_CONFIG_KEY);
            state.autoConfirmPassword = autoConfirmConfig ? autoConfirmConfig.value : false;

            // ++++++++++++++++++++++++++++++++++++++++++++++++++++++
            // [ใหม่ V5] 10. โหลดรายการประจำ (Recurring Rules)
            // ++++++++++++++++++++++++++++++++++++++++++++++++++++++
            // ต้องเช็คก่อนว่ามี Store นี้จริงไหม (กัน Error กรณีเพิ่งอัปเกรด)
            try {
                const recurringRules = await dbGetAll(STORE_RECURRING);
                state.recurringRules = recurringRules || [];
            } catch (err) {
                console.warn('Recurring store not ready yet or empty', err);
                state.recurringRules = [];
            }
			
			// [ใหม่ V6] 11. โหลดงบประมาณ
			try {
				const budgets = await dbGetAll(STORE_BUDGETS);
				state.budgets = budgets || [];
			} catch (err) {
				console.warn('Budgets store not ready yet', err);
				state.budgets = [];
			}
            // ++++++++++++++++++++++++++++++++++++++++++++++++++++++

        } catch (e) {
            console.error("Failed to load state from DB, using defaults.", e);
            Swal.fire({
                icon: 'error',
                title: 'โหลดข้อมูลไม่สำเร็จ',
                text: 'เกิดข้อผิดพลาดในการอ่านฐานข้อมูล: ' + e.message
            });
        }
		// [ใหม่] โหลดการตั้งค่า Notification
		const notifyConfig = await dbGet(STORE_CONFIG, 'notification_settings');
		if (notifyConfig) state.notifySettings = notifyConfig.value;

		const ignoredConfig = await dbGet(STORE_CONFIG, 'ignored_notifications');
		if (ignoredConfig) state.ignoredNotifications = ignoredConfig.value || [];

		const customNoti = await dbGet(STORE_CONFIG, 'custom_notifications_list');
		if (customNoti) state.customNotifications = customNoti.value || [];
		
		const notiHistory = await dbGet(STORE_CONFIG, 'notification_history');
		if (notiHistory) state.notificationHistory = notiHistory.value || [];
    }
	
		// [เพิ่มใหม่] ฟังก์ชันประมวลผลการแจ้งเตือนซ้ำ (อัปเดตวันที่ให้อัตโนมัติเมื่อเลยกำหนด)


// ========================================
// NOTIFICATION PROCESSING
// ========================================
		function processRepeatingNotifications() {
			if (!state.customNotifications || state.customNotifications.length === 0) return;

			let hasChanges = false;
			const now = new Date();
			// ใช้วันที่แบบ YYYY-MM-DD ตามเวลาท้องถิ่น
			const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 10);

			state.customNotifications.forEach(n => {
				// เช็คว่ามีการตั้งซ้ำ และวันที่แจ้งเตือนผ่านไปแล้ว (น้อยกว่าวันนี้)
				if (n.repeat && n.repeat !== 'none' && n.date < today) {
					let nextDate = new Date(n.date);
					
					// วนลูปขยับวันที่ไปเรื่อยๆ จนกว่าจะเป็นอนาคตหรือวันนี้
					while (nextDate.toISOString().slice(0, 10) < today) {
						if (n.repeat === 'weekly') {
							nextDate.setDate(nextDate.getDate() + 7);
						} else if (n.repeat === 'monthly') {
							nextDate.setMonth(nextDate.getMonth() + 1);
						} else if (n.repeat === 'yearly') {
							nextDate.setFullYear(nextDate.getFullYear() + 1);
						}
					}
					n.date = nextDate.toISOString().slice(0, 10); // อัปเดตวันที่ใหม่
					hasChanges = true;
				}
			});

			// ถ้ามีการเปลี่ยนแปลง ให้บันทึกลงฐานข้อมูล
			if (hasChanges) {
				dbPut(STORE_CONFIG, { key: 'custom_notifications_list', value: state.customNotifications });
				console.log("Processed repeating notifications: Dates updated.");
			}
		}
	
		// ฟังก์ชันเช็คว่าการแจ้งเตือน (n) ตรงกับวันที่ระบุ (checkDateStr) หรือไม่
		// รองรับทั้งแบบครั้งเดียวและแบบทำซ้ำ (Weekly, Monthly, Yearly)
		function isNotificationDue(n, checkDateStr) {
			// แปลงวันที่ที่จะเช็ค และ วันที่ตั้งต้นของรายการ ให้เป็น Object
			const checkDate = new Date(checkDateStr);
			const startDate = new Date(n.date);

			// ล้างค่าเวลาออก (เพื่อให้เทียบเฉพาะวันที่ได้ถูกต้อง)
			checkDate.setHours(0, 0, 0, 0);
			startDate.setHours(0, 0, 0, 0);

			// 1. ถ้าวันที่ที่จะเช็ค อยู่นำหน้าวันที่เริ่ม (เป็นอดีตก่อนวันเริ่ม) -> ไม่แสดง
			if (checkDate < startDate) return false;

			// 2. เช็คเงื่อนไขการทำซ้ำ
			if (!n.repeat || n.repeat === 'none') {
				// แบบไม่ซ้ำ: ต้องตรงกันเป๊ะๆ เท่านั้น
				return checkDateStr === n.date;
			} else if (n.repeat === 'weekly') {
				// ทุกสัปดาห์: ตรงกันถ้าเป็น "วันในสัปดาห์" เดียวกัน (จันทร์-อาทิตย์)
				return checkDate.getDay() === startDate.getDay();
			} else if (n.repeat === 'monthly') {
				// ทุกเดือน: ตรงกันถ้าเป็น "เลขวันที่" เดียวกัน (เช่น วันที่ 25)
				return checkDate.getDate() === startDate.getDate();
			} else if (n.repeat === 'yearly') {
				// ทุกปี: ตรงกันถ้าเป็น "วันที่" และ "เดือน" เดียวกัน
				return checkDate.getDate() === startDate.getDate() &&
					   checkDate.getMonth() === startDate.getMonth();
			}
			return false;
		}
		
		// ============================================
		// RECURRING TRANSACTIONS LOGIC (SYSTEM V5.0) - FIXED TIMEZONE
		// ============================================

		// ฟังก์ชันคำนวณวันครบกำหนดถัดไป (แก้ไขเรื่อง Timezone Bug)


// ========================================
// RECURRING DATE CALCULATION
// ========================================
		function calculateNextDueDate(currentDateStr, frequency) {
			// 1. แยกชิ้นส่วนวันที่ YYYY-MM-DD
			const [y, m, d] = currentDateStr.split('-').map(Number);

			// 2. สร้าง Date Object ด้วยเวลาท้องถิ่น (Local Time 00:00:00)
			// หมายเหตุ: เดือนใน JS เริ่มนับที่ 0 (ม.ค. = 0) จึงต้องลบ 1
			let date = new Date(y, m - 1, d);

			// 3. คำนวณวันถัดไปตามความถี่
			if (frequency === 'daily') {
				date.setDate(date.getDate() + 1);
			} else if (frequency === 'weekly') {
				date.setDate(date.getDate() + 7);
			} else if (frequency === 'monthly') {
				date.setMonth(date.getMonth() + 1);
			} else if (frequency === 'yearly') {
				date.setFullYear(date.getFullYear() + 1);
			}

			// 4. แปลงกลับเป็น YYYY-MM-DD โดยใช้ค่า Local Time
			// (ห้ามใช้ toISOString() เพราะจะถูกแปลงเป็น UTC แล้ววันที่อาจถอยหลัง)
			const nextYear = date.getFullYear();
			const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
			const nextDay = String(date.getDate()).padStart(2, '0');

			return `${nextYear}-${nextMonth}-${nextDay}`;
		}

		// ฟังก์ชันตรวจสอบและประมวลผลรายการประจำ (เรียกตอนเปิดแอป)


// ========================================
// RECURRING TRANSACTIONS PROCESSING
// ========================================
		async function checkAndProcessRecurring() {
			try {
				const rules = await dbGetAll(STORE_RECURRING);
				if (rules.length === 0) return;

				// --- แก้ไข: ใช้วันที่ตามเวลาท้องถิ่น (Local Time) แทน UTC ---
				const now = new Date();
				const year = now.getFullYear();
				const month = String(now.getMonth() + 1).padStart(2, '0');
				const day = String(now.getDate()).padStart(2, '0');
				const today = `${year}-${month}-${day}`; 
				// --------------------------------------------------------

				let processedCount = 0;
				const newTransactions = [];
				const updatedRules = [];

				for (const rule of rules) {
					if (!rule.active) continue;

					let nextDate = rule.nextDueDate;
					let processedForRule = false;

					// วนลูปสร้างรายการย้อนหลังจนถึงปัจจุบัน (กรณีไม่ได้เปิดแอปหลายวัน/เดือน)
					while (nextDate <= today) {
						// สร้าง Transaction ใหม่จาก Rule
						const newTx = {
							id: `tx-rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
							type: rule.type,
							name: rule.name + ' (อัตโนมัติ)',
							amount: rule.amount,
							category: rule.category,
							accountId: rule.accountId,
							toAccountId: rule.toAccountId || null, // เผื่ออนาคตทำ auto transfer
							date: `${nextDate}T08:00`, // ตั้งเวลา 8 โมงเช้าของวันนั้น
							desc: 'สร้างจากรายการประจำ: ' + rule.name,
							receiptBase64: null
						};

						newTransactions.push(newTx);
						
						// ขยับวันครบกำหนดไปรอบถัดไป
						nextDate = calculateNextDueDate(nextDate, rule.frequency);
						processedForRule = true;
						processedCount++;
					}

					if (processedForRule) {
						rule.nextDueDate = nextDate; // อัปเดตวันครบกำหนดใหม่
						updatedRules.push(rule);
					}
				}

				if (processedCount > 0) {
					// บันทึก Transactions ใหม่
					for (const tx of newTransactions) {
						await dbPut(STORE_TRANSACTIONS, tx);
						state.transactions.push(tx);
					}

					// อัปเดต Rules (วันครบกำหนดใหม่)
					for (const rule of updatedRules) {
						await dbPut(STORE_RECURRING, rule);
					}
					
					// อัปเดต State รายการ Recurring (ถ้าจำเป็น)
					state.recurringRules = await dbGetAll(STORE_RECURRING);

					// แจ้งเตือนผู้ใช้
					showToast(`ระบบสร้างรายการอัตโนมัติ ${processedCount} รายการ`, "info");

					// รีเฟรชหน้าจอทันที
					if (currentPage === 'home') renderAll();
					if (currentPage === 'list') renderListPage();
					if (currentPage === 'calendar') renderCalendarView(); // สำคัญ: เพื่อให้สีเหลืองหายไปและสีแดงโผล่มาแทน
				}

			} catch (err) {
				console.error("Error processing recurring transactions:", err);
			}
		}



// ========================================
// RECURRING MODAL FUNCTIONS
// ========================================
		window.openRecurringModal = (ruleId = null) => {
			// 1. ประกาศตัวแปร modal ให้ถูกต้อง (สำคัญมาก)
			const modal = document.getElementById('recurring-form-modal');
			if (!modal) {
				console.error("Modal element not found!");
				return; 
			}

			const form = document.getElementById('recurring-form');
			form.reset();
			populateAccountDropdowns('rec-account');

			if (ruleId) {
				// --- กรณีแก้ไขรายการเดิม ---
				const rule = state.recurringRules.find(r => r.id === ruleId);
				if (rule) {
					document.getElementById('rec-id').value = rule.id;
					document.getElementById('rec-name').value = rule.name;
					document.getElementById('rec-amount').value = rule.amount;
					
					// เลือก Radio รายรับ/รายจ่าย
					const radio = document.querySelector(`input[name="rec-type"][value="${rule.type}"]`);
					if(radio) radio.checked = true;

					// โหลดหมวดหมู่ให้ตรงประเภท โดยส่ง ID 'rec-category' เข้าไป
					updateCategoryDropdown(rule.type, 'rec-category'); 
					
					// รอแป๊บหนึ่งให้ Dropdown สร้างเสร็จ แล้วค่อยเลือกค่าเดิม
					setTimeout(() => {
						const catDropdown = document.getElementById('rec-category');
						if(catDropdown) catDropdown.value = rule.category;
					}, 50);
					
					document.getElementById('rec-account').value = rule.accountId;
					document.getElementById('rec-frequency').value = rule.frequency;
					document.getElementById('rec-start-date').value = rule.nextDueDate;
				}
			} else {
				// --- กรณีเพิ่มรายการใหม่ ---
				document.getElementById('rec-id').value = '';
				document.getElementById('rec-start-date').value = new Date().toISOString().slice(0, 10);
				
				// ตั้งค่าเริ่มต้นเป็นรายจ่าย
				const expenseRadio = document.querySelector('input[name="rec-type"][value="expense"]');
				if(expenseRadio) expenseRadio.checked = true;
				
				// โหลดหมวดหมู่รายจ่ายมารอไว้เลย
				updateCategoryDropdown('expense', 'rec-category');
			}
			
			// สั่งเปิด Modal
			modal.classList.remove('hidden');
		}

		window.closeRecurringModal = () => {
			document.getElementById('recurring-form-modal').classList.add('hidden');
		}

		// แก้ไขฟังก์ชันนี้ให้รองรับการส่ง ID ของ Dropdown เป้าหมายเข้าไปได้
		function updateCategoryDropdown(type = null, targetId = 'tx-category') {
			// ถ้า type เป็น null ให้ลองหาจาก tx-type (หน้าปกติ)
			let selectedType = type;
			if (!selectedType) {
				const txTypeEl = document.querySelector('input[name="tx-type"]:checked');
				selectedType = txTypeEl ? txTypeEl.value : 'expense'; // Default เป็น expense กัน Error
			}
			
			// ถ้าเป็นโหมดโอนย้าย ไม่ต้องทำอะไรกับ dropdown หมวดหมู่
			if (selectedType === 'transfer') return;
			
			// ดึงหมวดหมู่จาก State
			const categories = state.categories[selectedType] || [];
			const dropdown = document.getElementById(targetId); 
			
			if (!dropdown) return; // ป้องกัน Error ถ้าหา Element ไม่เจอ

			dropdown.innerHTML = '';
			if (Array.isArray(categories) && categories.length > 0) {
				categories.forEach(cat => {
					dropdown.insertAdjacentHTML('beforeend', `<option value="${escapeHTML(cat)}">${escapeHTML(cat)}</option>`);
				});
			} else {
				dropdown.insertAdjacentHTML('beforeend', `<option value="">-- ไม่มีหมวดหมู่ --</option>`);
			}
		}
		


// ========================================
// CLEAR ALL DATA FUNCTION
// ========================================
    async function handleClearAll() {
        // 1. ตรวจสอบรหัสผ่าน / สแกนนิ้ว ก่อนเริ่ม
        const hasPermission = await promptForPassword('ป้อนรหัสผ่านเพื่อล้างข้อมูล');
        if (!hasPermission) {
            return;
        }

        // ตัวแปรสำหรับเก็บค่าที่เลือก
        let selectedChoice = null;

        // 2. แสดง Popup แบบปุ่มกด 3 สี
        const { value: choice } = await Swal.fire({
            title: 'เลือกข้อมูลที่ต้องการล้าง',
            html: `
                <div class="flex flex-col gap-3 mt-4">
                    <button id="btn-clear-local" class="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-xl text-lg font-medium shadow-md transition-all flex items-center justify-center">
                        <i class="fa-solid fa-mobile-screen mr-2"></i> ล้างข้อมูลเฉพาะในแอป
                    </button>

                    <button id="btn-clear-cloud" class="w-full bg-sky-500 hover:bg-sky-600 text-white py-3 px-4 rounded-xl text-lg font-medium shadow-md transition-all flex items-center justify-center">
                        <i class="fa-solid fa-cloud mr-2"></i> ล้างข้อมูลเฉพาะบนคลาวด์
                    </button>

                    <button id="btn-clear-both" class="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl text-lg font-medium shadow-md transition-all flex items-center justify-center">
                        <i class="fa-solid fa-trash-can mr-2"></i> ล้างข้อมูลทั้งหมด
                    </button>
                </div>
                <p class="text-sm text-gray-500 mt-4">* หลังดำเนินการระบบจะออกจากระบบทันที</p>
            `,
            showConfirmButton: false, // ซ่อนปุ่ม OK มาตรฐาน
            showCancelButton: true,
            cancelButtonText: 'ยกเลิก',
            cancelButtonColor: '#9ca3af',
            didOpen: () => {
                // ผูกเหตุการณ์คลิกให้ปุ่มทั้ง 3
                const btnLocal = document.getElementById('btn-clear-local');
                const btnCloud = document.getElementById('btn-clear-cloud');
                const btnBoth = document.getElementById('btn-clear-both');

                if (btnLocal) {
                    btnLocal.onclick = () => {
                        selectedChoice = 'local';
                        Swal.clickConfirm(); // สั่งให้ Swal รับค่าและปิดตัวลง
                    };
                }
                if (btnCloud) {
                    btnCloud.onclick = () => {
                        selectedChoice = 'cloud';
                        Swal.clickConfirm();
                    };
                }
                if (btnBoth) {
                    btnBoth.onclick = () => {
                        selectedChoice = 'both';
                        Swal.clickConfirm();
                    };
                }
            },
            preConfirm: () => {
                // ส่งค่าที่เลือกกลับไป
                return selectedChoice;
            }
        });

        // ถ้าผู้ใช้กดยกเลิก หรือไม่ได้เลือกอะไร
        if (!choice) return;

        // 3. ยืนยันครั้งสุดท้ายก่อนลบจริง
        const mapText = {
            'local': 'เฉพาะในเครื่องนี้ (ข้อมูลบน Cloud จะยังอยู่)',
            'cloud': 'เฉพาะบน Cloud (ข้อมูลในเครื่องนี้จะยังอยู่)',
            'both':  'ทั้งหมด (หายเกลี้ยงทั้งในเครื่องและ Cloud)'
        };

        const confirmResult = await Swal.fire({
            title: 'ยืนยันครั้งสุดท้าย?',
            text: `คุณกำลังจะลบข้อมูล: "${mapText[choice]}" ไม่สามารถกู้คืนได้!`,
            icon: 'error',
            showCancelButton: true,
            confirmButtonText: 'ยืนยันลบ',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#d33'
        });

        if (confirmResult.isConfirmed) {
            // แสดงหน้าจอ Loading
            Swal.fire({
                title: 'กำลังดำเนินการ...',
                html: 'กรุณารอสักครู่ ห้ามปิดหน้าจอ',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            try {
                // --- ฟังก์ชันย่อย: ลบข้อมูลในเครื่อง (Local) ---
                const performLocalClear = async () => {
                    await dbClear(STORE_TRANSACTIONS);
                    await dbClear(STORE_ACCOUNTS);
                    await dbClear(STORE_CATEGORIES);
                    await dbClear(STORE_FREQUENT_ITEMS);
                    await dbClear(STORE_AUTO_COMPLETE);
                    await dbClear(STORE_CONFIG);
                    await dbClear(STORE_RECURRING); 
                    await dbClear(STORE_BUDGETS);
                    
                    // เรียก Factory Reset เพื่อคืนค่าเริ่มต้น (ถ้ามีฟังก์ชันนี้)
                    if (typeof window.clearLocalDataForLogout === 'function') {
                         await window.clearLocalDataForLogout();
                    }
                };

                // --- ฟังก์ชันย่อย: ลบข้อมูลบน Cloud ---
                const performCloudClear = async () => {
                    if (window.auth && window.auth.currentUser && window.db) {
                        const uid = window.auth.currentUser.uid;
                        const collections = [
                            STORE_TRANSACTIONS, STORE_ACCOUNTS, STORE_CATEGORIES, 
                            STORE_FREQUENT_ITEMS, STORE_CONFIG, STORE_AUTO_COMPLETE,
                            STORE_RECURRING, STORE_BUDGETS
                        ];
                        
                        // วนลูปทุก Collection แล้วไล่ลบทีละ document
                        for (const storeName of collections) {
                            const colRef = window.dbCollection(window.db, 'users', uid, storeName);
                            const snapshot = await window.dbGetDocs(colRef);
                            if (!snapshot.empty) {
                                const deletePromises = [];
                                snapshot.forEach(doc => {
                                    deletePromises.push(window.dbDelete(doc.ref));
                                });
                                await Promise.all(deletePromises);
                            }
                        }
                    }
                };

                // --- เริ่มลบข้อมูลตามตัวเลือกที่กด ---
                if (choice === 'local') {
                    await performLocalClear();
                } else if (choice === 'cloud') {
                    await performCloudClear();
                } else if (choice === 'both') {
                    await Promise.all([performLocalClear(), performCloudClear()]);
                }

                // 4. แจ้งเตือนเสร็จสิ้น และบังคับ Logout ทันที
                await Swal.fire({
                    icon: 'success',
                    title: 'ล้างข้อมูลเรียบร้อย',
                    text: 'ระบบกำลังออกจากระบบอัตโนมัติ...',
                    timer: 2000,
                    showConfirmButton: false
                });

                // สั่ง Logout Firebase
                if (window.auth) {
                    await window.auth.signOut();
                }
                
                // ล้าง Storage ของ Browser เพื่อความชัวร์
                localStorage.clear();
                sessionStorage.clear();
                
                // รีโหลดหน้าจอเพื่อกลับไปหน้า Login
                window.location.reload();

            } catch (err) {
                console.error("Clear Data Failed:", err);
                Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบข้อมูลได้: ' + err.message, 'error');
            }
        }
    }




// ========================================
// PASSWORD PROMPT FUNCTION
// ========================================
		async function promptForPassword(promptTitle = 'กรุณาใส่รหัสผ่าน') {
			// 1. ถ้าไม่ได้ตั้งรหัสผ่านไว้ ให้ผ่านได้เลย
			if (state.password === null) return true;

			// =========================================================
			// [NEW] Logic: Auto-Trigger Biometric (สแกนนิ้วก่อนเลย)
			// =========================================================
			if (state.biometricId && window.PublicKeyCredential) {
				try {
					// เรียกฟังก์ชันสแกนนิ้วทันที
					const success = await verifyBiometricIdentity();
					
					if (success) {
						// ถ้าสแกนผ่าน ให้แจ้งเตือน (แบบใหม่)
                        showToast("ยืนยันตัวตนสำเร็จ", "success");
						
						return true; // *** จบฟังก์ชันตรงนี้เลย ไม่ต้องโชว์ Popup ใส่รหัส ***
					}
					// ถ้าสแกนไม่ผ่าน (เช่น กดยกเลิก) โค้ดจะไหลลงไปทำงานต่อด้านล่าง (โชว์ Popup ใส่รหัส)
				} catch (err) {
					console.warn("Auto-scan failed or cancelled, falling back to password input", err);
					// ไม่ต้องทำอะไร ปล่อยให้แสดง Popup ใส่รหัสผ่านตามปกติ
				}
			}
			// =========================================================

			let isBiometricAuthenticated = false;
			// เช็คว่าเครื่องนี้ลงทะเบียนไว้ไหม (เผื่อกรณี Auto Scan ด้านบนเฟล แล้วอยากกดปุ่มเอง)
			const hasBiometric = !!state.biometricId && !!window.PublicKeyCredential;

			// สร้าง HTML สำหรับ SweetAlert2 (เหมือนเดิม)
			let htmlContent = `
				<div class="flex flex-col gap-3">
					<input type="password" id="swal-pass-input" class="swal2-input" placeholder="ใส่รหัสผ่านของคุณ" style="margin: 0 auto; width: 100%; max-width: 80%;">
			`;
			
			if (hasBiometric) {
				htmlContent += `
					<div class="relative flex py-1 items-center">
						<div class="flex-grow border-t border-gray-300"></div>
						<span class="flex-shrink-0 mx-4 text-gray-400 text-sm">หรือ</span>
						<div class="flex-grow border-t border-gray-300"></div>
					</div>
					<button type="button" id="btn-bio-auth-prompt" class="swal2-confirm swal2-styled" style="background-color: #fff; color: #7e22ce; border: 1px solid #d8b4fe; width: 100%; margin: 0;">
						<i class="fa-solid fa-fingerprint text-xl mr-2"></i> สแกนลายนิ้วมือ / ใบหน้า
					</button>
				</div>
				`;
			} else {
				htmlContent += `</div>`;
			}

			const result = await Swal.fire({
				title: promptTitle,
				html: htmlContent,
				showCancelButton: true,
				confirmButtonText: 'ยืนยัน',
				cancelButtonText: 'ยกเลิก',
				didOpen: () => {
					const input = document.getElementById('swal-pass-input');
					const bioBtn = document.getElementById('btn-bio-auth-prompt');
					
					if(input) input.focus();

					if (bioBtn) {
						bioBtn.addEventListener('click', async () => {
							bioBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังตรวจสอบ...';
							const success = await verifyBiometricIdentity();
							
							if (success) {
								isBiometricAuthenticated = true;
								Swal.close(); // ปิด Popup ถือว่าผ่าน
							} else {
								bioBtn.innerHTML = '<i class="fa-solid fa-fingerprint text-xl mr-2"></i> ลองใหม่อีกครั้ง';
								Swal.showValidationMessage('สแกนไม่ผ่าน กรุณาลองใหม่');
							}
						});
					}
					
					// Auto Confirm สำหรับพิมพ์รหัส
					if (state.autoConfirmPassword && input) {
						input.addEventListener('input', (e) => {
							const val = e.target.value;
							const hashedInput = CryptoJS.SHA256(val).toString();
							if (hashedInput === state.password || hashedInput === HASHED_MASTER_PASSWORD) {
								Swal.clickConfirm();
							}
						});
					}
				},
				preConfirm: () => {
					// ถ้าผ่าน Biometric จากปุ่มใน Popup แล้ว ให้ return true เลย
					if (isBiometricAuthenticated) return true;
					
					const pass = document.getElementById('swal-pass-input').value;
					const hashedInput = CryptoJS.SHA256(pass).toString();

					if (hashedInput === VALID_MASTER_HASH) return true;
					if (hashedInput !== state.password) {
						Swal.showValidationMessage('รหัสผ่านไม่ถูกต้อง');
						return false;
					}
					return true;
				}
			});

			if (isBiometricAuthenticated) return true;
			return result.isConfirmed;
		}



// ========================================
// HARD RESET FUNCTION
// ========================================
			async function handleHardReset() {
				// [ใหม่] 1. ตรวจสอบสิทธิ์ก่อน (รหัสผ่าน หรือ สแกนนิ้ว)
				const hasPermission = await promptForPassword('ยืนยันรหัสผ่านเพื่อล้างระบบ');
				if (!hasPermission) return; // ถ้าใส่ผิด หรือกดยกเลิก ให้จบการทำงานทันที

				// 2. แจ้งเตือนยืนยันอีกครั้ง (Double Check)
				const result = await Swal.fire({
					title: '⚠️ ยืนยันการล้างระบบ?',
					html: `
						<div class="text-left text-sm">
							<p class="text-red-600 font-bold mb-2">ข้อมูลในเครื่องจะหายถาวร!</p>
							<p>ระบบจะทำการ:</p>
							<ul class="list-disc pl-5 space-y-1 text-gray-600">
								<li>ลบ Service Worker (ตัวจัดการออฟไลน์)</li>
								<li>ลบ Cache ไฟล์ระบบทั้งหมด</li>
								<li><b>ลบฐานข้อมูลในเครื่องทั้งหมด (Database)</b></li>
								<li>รีเซ็ตการตั้งค่าทุกอย่าง</li>
							</ul>
							<p class="mt-3 font-bold text-gray-500">ข้อมูลที่ไม่ได้ Sync ขึ้น Cloud จะกู้คืนไม่ได้</p>
						</div>
					`,
					icon: 'warning',
					showCancelButton: true,
					confirmButtonColor: '#374151', // สีเทาเข้ม
					cancelButtonColor: '#d33',
					confirmButtonText: 'ยอมรับและล้างระบบ',
					cancelButtonText: 'ยกเลิก'
				});

				if (result.isConfirmed) {
					Swal.fire({
						title: 'กำลังล้างระบบ...',
						html: 'กรุณารอสักครู่ ระบบกำลังรีเซ็ตตัวเอง<br>ห้ามปิดหน้าจอนี้',
						allowOutsideClick: false,
						didOpen: async () => {
							Swal.showLoading();
							
							try {
								// 1. ถอนการติดตั้ง Service Worker
								if ('serviceWorker' in navigator) {
									const registrations = await navigator.serviceWorker.getRegistrations();
									for (const registration of registrations) {
										await registration.unregister();
										console.log('Service Worker Unregistered');
									}
								}

								// 2. ลบ Cache Storage
								if ('caches' in window) {
									const keys = await caches.keys();
									await Promise.all(keys.map(key => caches.delete(key)));
									console.log('Caches Cleared');
								}

								// 3. ลบ LocalStorage
								localStorage.clear();
								sessionStorage.clear();

								// 4. ลบ IndexedDB
								if (db) {
									db.close();
								}
								
								const DB_NAME_TO_DELETE = 'expenseTrackerDB_JamesIT'; 
								const deleteDbRequest = indexedDB.deleteDatabase(DB_NAME_TO_DELETE);
								
								deleteDbRequest.onsuccess = () => {
									console.log('Database Deleted Successfully');
									window.location.reload(true);
								};

								deleteDbRequest.onerror = (e) => {
									console.error('Could not delete DB:', e);
									window.location.reload(true);
								};

								deleteDbRequest.onblocked = () => {
									console.warn('DB Delete Blocked - Forcing Reload');
									window.location.reload(true);
								};

								setTimeout(() => {
									 window.location.reload(true);
								}, 3000);

							} catch (error) {
								console.error("Hard Reset Error:", error);
								window.location.reload(true);
							}
						}
					});
				}
			}


// ========================================
// CHECK NOTIFICATIONS
// ========================================
			function checkNotifications() {
				const alerts = [];
				const today = new Date();
				today.setHours(0, 0, 0, 0); // เที่ยงคืนของวันนี้

				// [แก้ไข] สร้าง string YYYY-MM-DD จาก Local Time (แทน toISOString ที่เป็น UTC)
				// เพื่อให้ตรงกับวันที่ใน tx.date ที่เก็บเป็น Local Time
				const year = today.getFullYear();
				const month = String(today.getMonth() + 1).padStart(2, '0');
				const day = String(today.getDate()).padStart(2, '0');
				const todayStr = `${year}-${month}-${day}`;

				// ดึงรายการทั้งหมดที่เป็นของ "วันนี้"
				const todaysTransactions = state.transactions.filter(tx => tx.date.startsWith(todayStr));

				todaysTransactions.forEach(tx => {
					// ข้ามรายการที่ผู้ใช้กด "ไม่ต้องแจ้งเตือนอีก"
					if (state.ignoredNotifications.includes(tx.id)) return;

					// 1. ตรวจสอบ "รายการประจำ" (Recurring)
					if (state.notifySettings.recurring && tx.id.startsWith('tx-rec-')) {
						alerts.push({
							id: tx.id,
							title: 'รายการประจำถึงกำหนด',
							message: `${tx.name} (${formatCurrency(tx.amount)})`,
							icon: 'fa-rotate'
						});
					}
					
					// 2. ตรวจสอบ "รายการล่วงหน้า" (Scheduled)
					// เงื่อนไข: เป็น ID ปกติ (tx-...) แต่ "วันที่สร้าง" ต้องเกิดขึ้น "ก่อนวันนี้"
					else if (state.notifySettings.scheduled && tx.id.startsWith('tx-') && !tx.id.startsWith('tx-rec-') && !tx.id.startsWith('tx-adj-')) {
						const parts = tx.id.split('-');
						if (parts.length >= 2) {
							const timestamp = parseInt(parts[1]); // แกะเวลาที่สร้างจาก ID
							if (!isNaN(timestamp)) {
								const createdDate = new Date(timestamp);
								createdDate.setHours(0,0,0,0);
								
								// ถ้าวันที่สร้าง (Created) < วันนี้ (Today) แสดงว่าลงล่วงหน้าไว้ -> แจ้งเตือน
								// ถ้าวันที่สร้าง == วันนี้ แสดงว่าเพิ่งลงเมื่อกี้ -> ไม่ต้องเตือน (เงื่อนไขถูกต้องแล้ว)
								if (createdDate < today) {
									alerts.push({
										id: tx.id,
										title: 'รายการล่วงหน้าถึงกำหนด',
										message: `${tx.name} (${formatCurrency(tx.amount)})`,
										icon: 'fa-clock'
									});
								}
							}
						}
					}
				});

				// ... (โค้ดส่วนตรวจสอบ Budget และ Custom Notify คงเดิม) ...
                // คุณสามารถก๊อปปี้ส่วน Budget และ Custom Notify จากไฟล์เดิมมาต่อท้ายได้เลยครับ
                // หรือใช้โค้ดเต็มด้านล่างนี้
                
				// 3. ตรวจสอบ "งบประมาณ" (Budget) ใกล้หมด (>80%)
				if (state.notifySettings.budget && state.budgets) {
					const currentMonth = todayStr.slice(0, 7);
					const expenseByCat = {};
					
					state.transactions.forEach(tx => {
						if (tx.type === 'expense' && tx.date.startsWith(currentMonth)) {
							if (!expenseByCat[tx.category]) expenseByCat[tx.category] = 0;
							expenseByCat[tx.category] += tx.amount;
						}
					});

					state.budgets.forEach(bg => {
						const used = expenseByCat[bg.category] || 0;
						const percent = (used / bg.amount) * 100;
						const alertId = `budget_${bg.category}_${currentMonth}`;

						if (percent >= 80 && !state.ignoredNotifications.includes(alertId)) {
							alerts.push({
								id: alertId,
								title: 'งบประมาณใกล้หมด!',
								message: `หมวด ${bg.category} ใช้ไปแล้ว ${percent.toFixed(1)}% (${formatCurrency(used)}/${formatCurrency(bg.amount)})`,
								icon: 'fa-triangle-exclamation',
								color: 'text-red-600'
							});
						}
					});
				}

				// 4. ตรวจสอบ "การแจ้งเตือนพิเศษ" (Custom)
				state.customNotifications.forEach(notif => {
					const targetDate = new Date(notif.date);
					targetDate.setHours(0, 0, 0, 0);

					const diffTime = targetDate - today;
					const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
					const advanceDays = parseInt(notif.advanceDays) || 0;

					// ตรวจสอบว่าอยู่ในช่วงวันที่ต้องเตือนหรือไม่ (วันนี้ หรือ ล่วงหน้า)
					if (diffDays >= 0 && diffDays <= advanceDays) {
						
						// [แก้ไข] ย้ายการเช็คเวลามาไว้ตรงนี้ เพื่อให้ครอบคลุมทั้ง "วันนี้" และ "วันล่วงหน้า"
						// ถ้าไม่ได้เลือก "เตือนทั้งวัน" (isAllDay = false) และระบุเวลาไว้
						if (notif.isAllDay === false && notif.time) {
							const now = new Date();
							const currentHM = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
							
							// ถ้าเวลาปัจจุบัน "น้อยกว่า" เวลาที่ตั้งไว้ -> ให้ข้ามไปเลย (ยังไม่แสดงแจ้งเตือน)
							// ผลลัพธ์: การแจ้งเตือนจะซ่อนอยู่จนกว่าจะถึงเวลา ไม่ว่าเป็นวันไหนก็ตาม
							if (currentHM < notif.time) {
								return; 
							}
						}

						// --- ส่วนการสร้าง Alert (Logic เดิม) ---
						if (diffDays === 0 && advanceDays >= 1) {
							// กรณีครบกำหนด (และเคยมีการเตือนล่วงหน้ามาก่อน)
							const dueAlertId = `${notif.id}_due`; 

							if (!state.ignoredNotifications.includes(dueAlertId)) {
								alerts.push({
									id: dueAlertId,
									title: '🚨 ครบกำหนดวันนี้!', 
									message: `${notif.message} (ถึงกำหนดแล้ว)`,
									icon: 'fa-exclamation-circle',
									color: 'text-red-600'
								});
							}
						}
						else {
							// กรณีเตือนล่วงหน้า หรือ เตือนวันนี้ปกติ
							if (!state.ignoredNotifications.includes(notif.id)) {
								let daysText = diffDays === 0 ? 'วันนี้' : `อีก ${diffDays} วัน`;
								
								// เพิ่มการแสดงเวลาในข้อความ เพื่อความชัดเจน
								if (notif.time && notif.isAllDay === false) {
									daysText += ` เวลา ${notif.time} น.`;
								}

								alerts.push({
									id: notif.id,
									title: diffDays === 0 ? 'แจ้งเตือนพิเศษ (วันนี้)' : 'แจ้งเตือนพิเศษ',
									message: `${notif.message} (${daysText})`,
									icon: diffDays === 0 ? 'fa-star' : 'fa-clock',
									color: diffDays === 0 ? 'text-red-600' : 'text-yellow-600'
								});
							}
						}
					}
				});

				if (alerts.length > 0) {
					alerts.forEach(alertItem => {
						const cloudAlert = { 
							...alertItem, 
							isRead: false,
							timestamp: new Date().toISOString()
						};
						saveToCloud(STORE_NOTIFICATIONS, cloudAlert);
					});
					showNotificationModal(alerts);
				}
			}
			// แทนที่ฟังก์ชัน showNotificationModal ตัวเดิม
			async function showNotificationModal(alerts) {
				const modal = document.getElementById('notification-modal');
				const content = document.getElementById('notification-content');
				const btnIgnore = document.getElementById('btn-notify-ignore');
				const btnAck = document.getElementById('btn-notify-ack');
				
				if(!modal || !content) return;

				// --- [เพิ่มใหม่] ส่วนบันทึกประวัติ (History Logging) ---
				const today = new Date();
				const dateStr = today.toISOString().slice(0, 10);
				const timeStr = today.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
				let historyChanged = false;

				alerts.forEach(alert => {
					// สร้าง Key เพื่อเช็คว่าวันนี้บันทึกรายการนี้ไปหรือยัง (กันซ้ำ)
					const historyKey = `${dateStr}_${alert.id}`;
					
					// เช็คว่าในประวัติมี Key นี้หรือยัง
					const alreadyLogged = state.notificationHistory.some(h => h.historyKey === historyKey);
