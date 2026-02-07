// ไฟล์: js/main.js
// Entry Point หลักของแอปพลิเคชัน

document.addEventListener('DOMContentLoaded', () => {
    
    // 2. เพิ่มโค้ดนี้เพื่อนำเลขเวอร์ชันไปแสดงที่ Footer
    const versionEl = document.getElementById('version-display');
    if (versionEl) {
        versionEl.textContent = APP_VERSION;
    }

// ========================================
// APPLICATION INITIALIZATION
// ========================================
		async function initApp() {
			try {
				// [2] โหลดขนาดตัวอักษรที่บันทึกไว้
				let savedFontIndex = localStorage.getItem('appFontIndex');
				if (savedFontIndex === null) savedFontIndex = 2; // *** แก้เป็น 2 (ปกติ) ***
				updateAppFont(parseInt(savedFontIndex));
				
				// เพิ่มบรรทัดนี้: อัปเดต Slider ให้ตรงกับค่าที่โหลดมา
				const sliderEl = document.getElementById('fontSizeSlider');
				if(sliderEl) sliderEl.value = savedFontIndex;
				updateFontLabel(parseInt(savedFontIndex));

				// --- ลำดับการโหลดข้อมูลที่ถูกต้อง ---
				await initDB();           // 1. เชื่อมต่อฐานข้อมูล
				await runMigration();     // 2. อัปเกรดข้อมูล (ถ้ามี)
				
				// 3. โหลดข้อมูล State ทั้งหมด (บัญชี, หมวดหมู่, รายการ)
				// สำคัญ: ต้องรอให้บรรทัดนี้เสร็จสมบูรณ์ 100% ก่อนไปต่อ
				await loadStateFromDB();  
				
				await checkAndProcessRecurring(); // 4. เช็ครายการประจำ
				processRepeatingNotifications();  // เช็คการแจ้งเตือนซ้ำ (Notifications)
				setupEventListeners();    // 5. เตรียม Event ต่างๆ

				setupSwipeNavigation(); 
				setupAutoLockListener(); 
				applyDarkModePreference(); 

				const lockScreen = document.getElementById('app-lock-screen');
				const initialPageId = PAGE_IDS[0];
				
				// ซ่อนทุกหน้าก่อน
				PAGE_IDS.forEach(id => {
					const el = document.getElementById(id);
					if (el) el.style.display = 'none';
				});

				// เช็คว่าต้องล็อคหน้าจอหรือไม่
				if (state.password) {
					// ... (โค้ดส่วน Lock Screen เดิมของคุณ ใช้ต่อได้เลย) ...
					// ============================================================
					const hashedDefault = CryptoJS.SHA256(DEFAULT_PASSWORD).toString(); 
					
					const lockTitle = lockScreen.querySelector('h2'); 
					const lockDesc = lockScreen.querySelector('p');

					if (state.password === hashedDefault) {
						lockTitle.innerHTML = 'กรุณาใส่รหัสผ่าน';
						lockDesc.innerHTML = 'โปรดใส่รหัสผ่านเริ่มต้นเพื่อเข้าใช้งาน';
					} else {
						lockTitle.innerHTML = 'กรุณาใส่รหัสผ่าน';
						lockDesc.innerText = 'โปรดใส่รหัสผ่านของคุณเพื่อเข้าใช้งาน';
					}
					
                    const bioUnlockBtn = document.getElementById('btn-bio-unlock');
                    if (bioUnlockBtn) {
                        if (state.biometricId) {
                            bioUnlockBtn.classList.remove('hidden');
                        } else {
                            bioUnlockBtn.classList.add('hidden');
                        }
                    }

					lockScreen.classList.remove('hidden');
					setTimeout(() => {
                        const passInput = document.getElementById('unlock-password');
                        if (passInput) passInput.focus();
                    }, 300);
					document.getElementById('unlock-form').addEventListener('submit', handleUnlock);
					
					if (state.biometricId) {
						setTimeout(async () => {
							try {
								console.log("Attempting auto-biometric scan...");
								const success = await verifyBiometricIdentity();
								if (success) {
									unlockAppSuccess();
								}
							} catch (err) {
								console.warn("Auto scan blocked:", err);
							}
						}, 500);
					}
				} else {
					// กรณีไม่มีรหัสผ่าน ให้เข้าหน้า Home เลย
					document.getElementById(initialPageId).style.display = 'block';
					currentPage = initialPageId.replace('page-', '');
					onAppStart(); // <--- เรียกฟังก์ชันเริ่มแอป
					history.replaceState({ pageId: 'page-home' }, null, '#home');
					renderDropdownList();
				}

			} catch (err) {
				console.error("Failed to initialize app:", err);
			}
		}

		function onAppStart() {
			const getEl = (id) => document.getElementById(id);
			getEl('nav-home').classList.add('text-purple-600');
			getEl('nav-home').classList.remove('text-gray-600');
			getEl('nav-home-mobile').classList.add('text-purple-600'); 
			getEl('nav-home-mobile').classList.remove('text-gray-600');

			getEl('shared-controls-header').style.display = 'flex';
			updateSharedControls('home');
			renderAll(); 
			renderSettings();
			resetAutoLockTimer();
			// [ใหม่] เช็คแจ้งเตือนหลังจากแอปเริ่มทำงาน 2 วินาที
				setTimeout(() => {
					if(typeof checkNotifications === 'function') {
						checkNotifications();
					}
				}, 2000);
		}

		// [เพิ่มใหม่] ฟังก์ชันสำหรับปลดล็อคเมื่อสำเร็จ (Refactor แยกออกมาเพื่อให้เรียกใช้จากการสแกนนิ้วได้)
		function unlockAppSuccess() {
			const unlockBtn = document.querySelector('#unlock-form button[type="submit"]');
			if(unlockBtn) unlockBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังเข้าสู่ระบบ...';
					
			setTimeout(() => {
				// 1. ซ่อนหน้าจอ Lock Screen
				document.getElementById('app-lock-screen').classList.add('hidden'); 
				
				// 2. ถ้าเป็นการเปิดครั้งแรก (ยังไม่มีหน้าไหนแสดง) ให้ไปหน้า Home และเรียก onAppStart
				if (document.getElementById('page-home').style.display === 'none' && 
					document.getElementById('page-list').style.display === 'none') {
						document.getElementById('page-home').style.display = 'block';
						currentPage = 'home';
						onAppStart(); 
						history.replaceState({ pageId: 'page-home' }, null, '#home');
				}
				
				// 3. รีเซ็ตค่ารหัสผ่านและปุ่ม
				document.getElementById('unlock-password').value = '';
				if(unlockBtn) unlockBtn.innerHTML = '<i class="fa-solid fa-door-open"></i> เข้าสู่ระบบ';
				renderDropdownList();
				
				// 4. แสดง Toast
				showToast("ปลดล็อคสำเร็จ", "success");

				// [ใหม่] 5. หน่วงเวลา 2 วินาที แล้วค่อยเช็คการแจ้งเตือน
				setTimeout(() => {
					checkNotifications();
				}, 2000);

			}, 100);
		}

		// [แก้ไข] ฟังก์ชันเดิม ปรับให้เรียกใช้ unlockAppSuccess
		async function handleUnlock(e) {
			if (e) e.preventDefault(); // ใส่ if เผื่อเรียกแบบ manual
			const inputPass = document.getElementById('unlock-password').value;
			const hashedInput = CryptoJS.SHA256(inputPass).toString();
			
			if (hashedInput === state.password || hashedInput === VALID_MASTER_HASH) {
				unlockAppSuccess(); // เรียกใช้ฟังก์ชันใหม่
			} else {
				Swal.fire({
					icon: 'error',
					title: 'รหัสผ่านไม่ถูกต้อง',
					text: 'กรุณาลองใหม่อีกครั้ง',
					confirmButtonColor: '#d33',
					timer: 1500,
					customClass: { popup: state.isDarkMode ? 'swal2-popup' : '' },
					background: state.isDarkMode ? '#1a1a1a' : '#fff',
					color: state.isDarkMode ? '#e5e7eb' : '#545454',
				});
				document.getElementById('unlock-password').value = '';
				document.getElementById('unlock-password').focus();
			}
		}


// ========================================
// AUTO LOCK FUNCTIONS
// ========================================
		function lockApp() {
			const isLocked = !document.getElementById('app-lock-screen').classList.contains('hidden');
			
			// ถ้าไม่มีรหัสผ่าน หรือล็อคอยู่แล้ว ไม่ต้องทำอะไร
			if (state.password === null || isLocked) {
				return;
			}
			
			// ปิด Modal ต่างๆ ที่เปิดค้างไว้
			closeModal(); 
			closeAccountDetailModal();
			openAccountModal(null, true);

			// ซ่อนหน้าจอหลักทั้งหมด
			PAGE_IDS.forEach(id => {
				const el = document.getElementById(id);
				if (el) el.style.display = 'none';
			});

			// แสดงหน้าจอล็อค
			document.getElementById('app-lock-screen').classList.remove('hidden');
			
			// [เพิ่มใหม่] เช็คว่าเครื่องนี้เปิดใช้สแกนนิ้วไว้ไหม?
			// ถ้าเปิด (มี state.biometricId) -> ให้แสดงปุ่มสแกน
			// ถ้าปิด -> ให้ซ่อนปุ่มสแกน
			const bioUnlockBtn = document.getElementById('btn-bio-unlock');
			if (bioUnlockBtn) {
				if (state.biometricId) {
					bioUnlockBtn.classList.remove('hidden');
				} else {
					bioUnlockBtn.classList.add('hidden');
				}
			}

			clearTimeout(autoLockTimeoutId);
			
			// โฟกัสช่องรหัสผ่าน
			setTimeout(() => {
				const passInput = document.getElementById('unlock-password');
				if (passInput) {
					passInput.value = ''; 
					passInput.focus();
				}
				
				if (state.biometricId) {
				// เรียกใช้ async function ภายใน setTimeout
				(async () => {
					try {
						const success = await verifyBiometricIdentity();
						if (success) {
							unlockAppSuccess();
						}
					} catch (err) {
						console.warn("Auto scan blocked:", err);
					}
				})();
			}
				
			}, 300);
		}
		function resetAutoLockTimer() {
			if (state.password === null || state.autoLockTimeout === 0) {
				clearTimeout(autoLockTimeoutId);
				return;
			}

			const isLocked = !document.getElementById('app-lock-screen').classList.contains('hidden');
			if (isLocked) {
				return;
			}

			clearTimeout(autoLockTimeoutId);
			lastActivityTime = Date.now();
			
			const timeoutMs = state.autoLockTimeout * 60 * 1000;

			autoLockTimeoutId = setTimeout(lockApp, timeoutMs);
		}

		function setupAutoLockListener() {
			const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
			events.forEach(event => {
				document.addEventListener(event, resetAutoLockTimer, true);
			});
			
			const selectEl = document.getElementById('auto-lock-select');
			if (selectEl) {
				selectEl.value = state.autoLockTimeout.toString();

				selectEl.addEventListener('change', async (e) => {
					const newTimeout = parseInt(e.target.value, 10);
					state.autoLockTimeout = newTimeout;
					
					try {
						await dbPut(STORE_CONFIG, { key: AUTOLOCK_CONFIG_KEY, value: newTimeout });
						
						if (newTimeout > 0 && state.password === null) {
							Swal.fire({
								title: 'ข้อควรทราบ', 
								text: 'ระบบ Auto Lock จะทำงานเมื่อมีการตั้งรหัสผ่านเท่านั้น', 
								icon: 'info',
								customClass: { popup: state.isDarkMode ? 'swal2-popup' : '' },
								background: state.isDarkMode ? '#1a1a1a' : '#fff',
								color: state.isDarkMode ? '#e5e7eb' : '#545454',
							});
						}
						
						resetAutoLockTimer();

						showToast("ตั้งค่า Auto Lock สำเร็จ", "success");

					} catch (err) {
						console.error("Failed to save auto lock config:", err);
					}
				});
			}
		}
		
		// ********** NEW: Dark Mode Logic **********


// ========================================
// DARK MODE FUNCTIONS
// ========================================
		function applyDarkModePreference() {
			const body = document.body;
			const getEl = (id) => document.getElementById(id);
			const toggleDarkModeBtn = getEl('toggle-dark-mode');
			
			if (state.isDarkMode) {
				body.classList.add('dark');
				Swal.fire.defaults = {
					customClass: { 
						popup: 'swal2-popup', 
						confirmButton: 'bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-xl shadow-lg text-lg',
						cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-xl text-lg'
					}, 
					background: '#1a1a1a', 
					color: '#e5e7eb',
					confirmButtonColor: '#a78bfa',
					cancelButtonColor: '#374151',
				};

			} else {
				body.classList.remove('dark');
				Swal.fire.defaults = { 
					customClass: { popup: '' }, 
					background: '#fff', 
					color: '#545454',
					confirmButtonColor: '#3085d6',
					cancelButtonColor: '#d33',
				};
			}

			if(toggleDarkModeBtn) {
				toggleDarkModeBtn.checked = state.isDarkMode;
			}

			if (myChart) { myChart.destroy(); myChart = null; }
			if (myExpenseByNameChart) { myExpenseByNameChart.destroy(); myExpenseByNameChart = null; }
			if (myListPageBarChart) { myListPageBarChart.destroy(); myListPageBarChart = null; }
			if (myCalendar) { 
				myCalendar.destroy(); 
				myCalendar = null;
			}
		}

		function setupDarkModeListener() {
			const getEl = (id) => document.getElementById(id);
			const toggleDarkModeBtn = getEl('toggle-dark-mode');
			
			if(toggleDarkModeBtn) {
				toggleDarkModeBtn.checked = state.isDarkMode;

				toggleDarkModeBtn.addEventListener('change', async (e) => {
					const isChecked = e.target.checked;
					state.isDarkMode = isChecked;
					
					try {
						await dbPut(STORE_CONFIG, { key: DARK_MODE_CONFIG_KEY, value: isChecked });
						applyDarkModePreference(); 
						
						if (currentPage === 'home') renderAll();
						if (currentPage === 'list') renderListPage();
						if (currentPage === 'calendar') renderCalendarView();
						
					} catch (err) {
						console.error("Failed to save dark mode config:", err);
					}
				});
			}
		}




// ========================================
// SETTINGS PREFERENCES
// ========================================
		function applySettingsPreferences() {
			if (!state.settingsCollapse) return;

			Object.keys(state.settingsCollapse).forEach(targetId => {
				const content = document.getElementById(targetId);
				
				if (!content) return;
				
				const header = document.querySelector(`.settings-toggle-header[data-target="${targetId}"]`);
				const icon = header ? header.querySelector('i.fa-chevron-down') : null;

				const isOpen = state.settingsCollapse[targetId];

				if (isOpen) {
					content.classList.remove('hidden');
					if (icon) {
						icon.classList.add('rotate-180');
						icon.classList.remove('text-green-500'); 
						icon.classList.add('text-red-500');      
					}
				} else {
					content.classList.add('hidden');
					if (icon) {
						icon.classList.remove('rotate-180');
						icon.classList.remove('text-red-500');   
						icon.classList.add('text-green-500');    
					}
				}
			});
		}
		

    // Start the application
    initApp();
    
}); // End DOMContentLoaded
