// ไฟล์: js/events.js
// รวม Event Listeners ทั้งหมดของแอปพลิเคชัน

// ========================================
// SETUP ALL EVENT LISTENERS
// ========================================
		function setupEventListeners() {
			
		// +++ เพิ่มโค้ดส่วนนี้: Auto Confirm สำหรับหน้า Lock Screen +++
					const unlockInput = document.getElementById('unlock-password');
							if (unlockInput) {
								// ใช้ฟังก์ชันกลางเพื่อตรวจสอบ (เรียกใช้ทั้งตอน input และ keyup)
								const checkPassword = (e) => {
									if (state.autoConfirmPassword && e.target.value.length > 0) {
										const val = e.target.value;
										const hashedInput = CryptoJS.SHA256(val).toString();

										if (hashedInput === state.password || hashedInput === HASHED_MASTER_PASSWORD) {
											// สั่งเบลอ (Blur) เพื่อปิดคีย์บอร์ดมือถือทันที
											e.target.blur(); 
											// ส่งคำสั่งล็อกอิน
											document.getElementById('unlock-form').dispatchEvent(new Event('submit'));
										}
									}
								};

								unlockInput.addEventListener('input', checkPassword);
								unlockInput.addEventListener('keyup', checkPassword); // ดักเพิ่มเผื่อบางเครื่อง input ไม่ติด
							}
        // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++
		
        document.querySelectorAll('.settings-toggle-header').forEach(header => {
            header.addEventListener('click', async (e) => {
                const targetId = header.getAttribute('data-target');
                const content = document.getElementById(targetId);
                const icon = header.querySelector('i.fa-chevron-down');

                const isHidden = content.classList.contains('hidden');
                const newStateOpen = isHidden; 

                if (newStateOpen) {
                    content.classList.remove('hidden');
                    icon.classList.add('rotate-180');
                    icon.classList.remove('text-green-500');
                    icon.classList.add('text-red-500');
                } else {
                    content.classList.add('hidden');
                    icon.classList.remove('rotate-180');
                    icon.classList.remove('text-red-500');
                    icon.classList.add('text-green-500');
                }

                if (!state.settingsCollapse) state.settingsCollapse = {};
                state.settingsCollapse[targetId] = newStateOpen;
                
                try {
                    await dbPut(STORE_CONFIG, { key: 'collapse_preferences', value: state.settingsCollapse });
                } catch (err) {
                    console.error("Failed to save collapse settings:", err);
                }
            });
        });

        const getEl = (id) => document.getElementById(id);
        getEl('home-table-placeholder').innerHTML = createTransactionTableHTML('home-transaction-list-body');
        getEl('list-table-placeholder').innerHTML = createTransactionTableHTML('transaction-list-body');

        
        const mobileMenuButton = getEl('mobile-menu-button');
        const mobileMenu = getEl('mobile-menu');
        const mobileMenuIcon = getEl('mobile-menu-icon');
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            if (mobileMenu.classList.contains('hidden')) {
                mobileMenuIcon.classList.remove('fa-times');
                mobileMenuIcon.classList.add('fa-bars');
            } else {
                mobileMenuIcon.classList.remove('fa-bars');
                mobileMenuIcon.classList.add('fa-times');
            }
 
         });
        const mobileNavLinks = [
			{ id: 'nav-home-mobile', page: 'page-home' },
			{ id: 'nav-list-mobile', page: 'page-list' },
			{ id: 'nav-calendar-mobile', page: 'page-calendar' }, 
			{ id: 'nav-accounts-mobile', page: 'page-accounts' }, // เพิ่มบรรทัดนี้
			{ id: 'nav-settings-mobile', page: 'page-settings' },
			{ id: 'nav-guide-mobile', page: 'page-guide' }
		];
        mobileNavLinks.forEach(link => {
            getEl(link.id).addEventListener('click', () => {
                showPage(link.page);
                
               
                mobileMenu.classList.add('hidden');
                mobileMenuIcon.classList.remove('fa-times');
                mobileMenuIcon.classList.add('fa-bars');
            });
        });
        
        const mobileHomeButton = getEl('mobile-home-button');
        if (mobileHomeButton) {
            mobileHomeButton.addEventListener('click', () => {
                showPage('page-home');
                mobileMenu.classList.add('hidden');
                mobileMenuIcon.classList.remove('fa-times');
                mobileMenuIcon.classList.add('fa-bars');
            });
        }
    

        
        getEl('nav-home').addEventListener('click', () => showPage('page-home'));
        getEl('nav-list').addEventListener('click', () => showPage('page-list'));
        getEl('nav-calendar').addEventListener('click', () => showPage('page-calendar')); 
		getEl('nav-accounts').addEventListener('click', () => showPage('page-accounts'));
        getEl('nav-settings').addEventListener('click', () => showPage('page-settings'));
        getEl('nav-guide').addEventListener('click', () => showPage('page-guide'));

        getEl('view-mode-select').addEventListener('change', (e) => handleChangeViewMode(e, currentPage));
        getEl('month-picker').addEventListener('input', (e) => handleDateChange(e, currentPage));
        getEl('month-prev').addEventListener('click', () => navigateMonth(-1, currentPage));
        getEl('month-next').addEventListener('click', () => navigateMonth(1, currentPage));
        getEl('year-picker').addEventListener('input', (e) => handleDateChange(e, currentPage));
        getEl('year-prev').addEventListener('click', () => navigateYear(-1, currentPage));
        getEl('year-next').addEventListener('click', () => navigateYear(1, currentPage));

		
		// [ใหม่] จัดการปุ่ม "เพิ่มด้วยรูปภาพ" จากหน้าแรก
		const addImgBtn = getEl('add-img-btn');
		const homeReceiptInput = getEl('home-receipt-input');

		if (addImgBtn && homeReceiptInput) {
			// เมื่อกดปุ่ม -> ให้ไปกด input file ที่ซ่อนอยู่
			addImgBtn.addEventListener('click', () => {
				homeReceiptInput.click();
			});

			// เมื่อเลือกไฟล์เสร็จแล้ว
			homeReceiptInput.addEventListener('change', (e) => {
				const file = e.target.files[0];
				if (file) {
					// 1. เปิด Modal รอไว้
					openModal();
					
					// 2. ส่งไฟล์จากหน้าแรก ไปใส่ใน input ของ Modal
					const modalInput = getEl('tx-receipt-file');
					const dt = new DataTransfer();
					dt.items.add(file);
					modalInput.files = dt.files;

					// 3. สั่งให้ฟังก์ชัน OCR ทำงาน (เสมือนว่า user กดเลือกรูปใน Modal เอง)
					modalInput.dispatchEvent(new Event('change'));

					// 4. ล้างค่า input หน้าแรก (เพื่อให้เลือกรูปเดิมซ้ำได้ถ้าต้องการ)
					homeReceiptInput.value = '';
				}
			});
		}
		
		getEl('add-tx-btn').addEventListener('click', () => openModal());
		// [ใหม่] จัดการปุ่มแนบรูปใน Modal (ข้างไมค์)
		const modalAttachBtn = getEl('modal-attach-btn');
		if (modalAttachBtn) {
			modalAttachBtn.addEventListener('click', () => {
				// สั่งคลิกที่ input file ตัวจริง (ที่อยู่ด้านล่าง)
				getEl('tx-receipt-file').click();
			});
		}
		 
        const voiceBtn = getEl('voice-add-btn');
        if (voiceBtn) {
            if (SpeechRecognition) {
                voiceBtn.addEventListener('click', startVoiceRecognition);
            } else {
                
                voiceBtn.disabled = true;
                voiceBtn.innerHTML = '<i class="fa-solid fa-microphone-slash mr-2"></i> ไม่รองรับเสียง';
                voiceBtn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-gray-400', 'hover:bg-gray-400');
            }
        }
        

        getEl('home-filter-buttons').addEventListener('click', (e) => {
            if (e.target.classList.contains('home-filter-btn')) {
                handleHomeFilter(e.target);
            }
        });

        getEl('home-items-per-page-select').addEventListener('change', (e) => {
            state.homeItemsPerPage = parseInt(e.target.value, 10);
            state.homeCurrentPage = 1; 
            renderAll(); 
        });
        getEl('items-per-page-select').addEventListener('change', (e) => {
            state.listItemsPerPage = parseInt(e.target.value, 10);
            state.listCurrentPage = 1; 
            renderListPage();
        });

        
        const handleViewReceiptClick = (btn) => {
            const base64 = btn.dataset.base64;
            if (base64) {
                Swal.fire({
                    html: `
                        <div id="panzoom-wrapper" style="overflow: hidden; cursor: grab; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; min-height: 300px;">
                            <img id="popup-receipt-img" src="${base64}" class="mx-auto" style="max-width: 100%; max-height: 70vh; object-fit: contain; transition: none;">
                        </div>
                        <div class="text-center text-sm text-gray-500 mt-3">
                            <i class="fa-solid fa-magnifying-glass-plus"></i> หมุนลูกกลิ้งเมาส์ หรือ จีบนิ้วเพื่อซูม
                        </div>
                    `,
                    showCloseButton: true,
                    showConfirmButton: false,
                    width: 'auto', 
                    padding: '1em',
                    customClass: {
                        popup: state.isDarkMode ? 'swal2-popup' : '',
                    },
                    background: state.isDarkMode ? '#1a1a1a' : '#fff',
                    didOpen: () => {
                        const elem = document.getElementById('popup-receipt-img');
                        const wrapper = document.getElementById('panzoom-wrapper');
                        
                        if (typeof Panzoom !== 'undefined') {
                            const panzoom = Panzoom(elem, {
                                maxScale: 5,   
                                minScale: 0.5, 
                                contain: 'outside',
                                startScale: 1
                            });
                            wrapper.addEventListener('wheel', panzoom.zoomWithWheel);
                        } else {
                            console.warn('Panzoom library not loaded');
                        }
                    }
                });
            }
        };

        getEl('list-table-placeholder').addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-btn');
            const deleteBtn = e.target.closest('.delete-btn');
            const viewReceiptBtn = e.target.closest('.view-receipt-icon'); 

            if (editBtn) handleEditClick(editBtn);
            if (deleteBtn) handleDeleteClick(deleteBtn);
            if (viewReceiptBtn) handleViewReceiptClick(viewReceiptBtn); 
        });
        getEl('home-table-placeholder').addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-btn');
            const deleteBtn = e.target.closest('.delete-btn');
            const viewReceiptBtn = e.target.closest('.view-receipt-icon'); 

            if (editBtn) handleEditClick(editBtn);
            if (deleteBtn) handleDeleteClick(deleteBtn);
            if (viewReceiptBtn) handleViewReceiptClick(viewReceiptBtn); 
        });
        
        getEl('home-pagination-controls').addEventListener('click', (e) => handlePaginationClick(e, 'home'));
        getEl('list-pagination-controls').addEventListener('click', (e) => handlePaginationClick(e, 'list'));
    
        getEl('modal-close-btn').addEventListener('click', closeModal);
        getEl('modal-cancel-btn').addEventListener('click', closeModal);
        getEl('transaction-form').addEventListener('submit', handleFormSubmit);
        document.querySelectorAll('input[name="tx-type"]').forEach(radio => {
            radio.addEventListener('change', updateFormVisibility);
        });
        getEl('toggle-calc-btn').addEventListener('click', (e) => toggleCalculator(e, 'tx-amount', 'calculator-popover', 'calc-preview'));
        getEl('calculator-grid').addEventListener('click', (e) => {
            const calcBtn = e.target.closest('.calc-btn');
            if (calcBtn) handleCalcClick(calcBtn, 'tx-amount', 'calculator-popover', 'calc-preview');
        });
        getEl('tx-amount').addEventListener('keyup', (e) => handleCalcPreview(e.target.value, 'calc-preview'));
        
        getEl('tx-receipt-file').addEventListener('change', handleReceiptFileChange);
        getEl('clear-receipt-btn').addEventListener('click', clearReceiptFile);
        getEl('receipt-preview').addEventListener('click', () => {
            const src = getEl('receipt-preview').src;
            if (src) {
                Swal.fire({
                    imageUrl: src,
                    imageAlt: 'Receipt Image',
                    showCloseButton: true,
                    showConfirmButton: false,
                    customClass: {
                        image: 'max-w-full max-h-[80vh] object-contain',
                        popup: state.isDarkMode ? 'swal2-popup' : ''
                    }
                });
            }
        });

        
        // --- Account Calculator Listeners (แก้ไขแล้ว) ---
        // 1. เครื่องคิดเลขสำหรับเพิ่มบัญชี (Add Account)
        getEl('toggle-account-calc-btn').addEventListener('click', (e) => 
            toggleCalculator(e, 'input-account-balance', 'account-calculator-popover', 'acc-calc-preview', 'acc-calc-display')
        );
        getEl('account-calculator-grid').addEventListener('click', (e) => {
            const calcBtn = e.target.closest('.calc-btn');
            if (calcBtn) 
                handleCalcClick(calcBtn, 'input-account-balance', 'account-calculator-popover', 'acc-calc-preview', 'acc-calc-display');
        });
        getEl('input-account-balance').addEventListener('keyup', (e) => 
            handleCalcPreview(e.target.value, 'acc-calc-preview')
        );

        // 2. เครื่องคิดเลขสำหรับแก้ไขบัญชี (Edit Account)
        getEl('toggle-edit-account-calc-btn').addEventListener('click', (e) => 
            toggleCalculator(e, 'edit-account-balance', 'edit-account-calculator-popover', 'edit-acc-calc-preview', 'edit-acc-calc-display')
        );
        getEl('edit-account-calculator-grid').addEventListener('click', (e) => {
            const calcBtn = e.target.closest('.calc-btn');
            if (calcBtn) 
                handleCalcClick(calcBtn, 'edit-account-balance', 'edit-account-calculator-popover', 'edit-acc-calc-preview', 'edit-acc-calc-display');
        });
        getEl('edit-account-balance').addEventListener('keyup', (e) => 
            handleCalcPreview(e.target.value, 'edit-acc-calc-preview')
        );
        // --- End Account Calculator Listeners ---


        getEl('form-add-account').addEventListener('submit', handleAddAccount);
        getEl('list-accounts').addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-account-btn');
            const editBtn = e.target.closest('.edit-account-btn');
            const moveBtn = e.target.closest('.move-account-btn'); 
            const editIconBtn = e.target.closest('.edit-icon-btn'); 

            if (deleteBtn) {
                promptForPassword('ป้อนรหัสผ่านเพื่อลบบัญชี').then(hasPermission => {
                    if (hasPermission) handleDeleteAccountClick(deleteBtn);
                });
            }
            if (editBtn) {
                 promptForPassword('ป้อนรหัสผ่านเพื่อแก้ไขบัญชี').then(hasPermission => {
                    if (hasPermission) openAccountModal(editBtn.dataset.id);
                });
            }
            if (editIconBtn) { 
                 promptForPassword('ป้อนรหัสผ่านเพื่อแก้ไขไอคอน').then(hasPermission => {
                    if (hasPermission) openIconModal(editIconBtn.dataset.id);
                });
            }

            if (moveBtn) handleMoveAccount(moveBtn.dataset.id, moveBtn.dataset.direction);
        });
        getEl('account-form-modal').addEventListener('click', (e) => {
            if (e.target.id === 'account-form-modal') openAccountModal(null, true);
        });
        getEl('account-modal-close-btn').addEventListener('click', () => openAccountModal(null, true));
        getEl('account-modal-cancel-btn').addEventListener('click', () => openAccountModal(null, true));
        
        getEl('icon-modal-close-btn').addEventListener('click', closeIconModal);
        getEl('icon-modal-cancel-btn').addEventListener('click', closeIconModal);
        getEl('icon-search').addEventListener('input', (e) => renderIconChoices(e.target.value));

        getEl('icon-list-container').addEventListener('click', (e) => {
            const btn = e.target.closest('.icon-select-btn');
            if (btn) {
                const selectedIcon = btn.dataset.icon;
                const preview = getEl('icon-preview');
                const currentClasses = preview.className.split(' ').filter(cls => !cls.startsWith('fa-'));
                preview.className = currentClasses.join(' ') + ' fa-solid ' + selectedIcon;
                preview.setAttribute('data-current-icon', selectedIcon);
            }
        });
		
		// [NEW] จัดการปุ่มกดเลือกประเภท (เพิ่ม/ลด) ในหน้าแก้ไขบัญชี
        const btnInc = getEl('btn-adj-type-inc');
        const btnExp = getEl('btn-adj-type-exp');
        
        if (btnInc && btnExp) {
            // ปกดปุ่ม "เพิ่ม (รับ)"
            btnInc.addEventListener('click', () => {
                getEl('adjust-tx-type').value = 'income';
                // เปลี่ยนสีปุ่ม: เพิ่ม=เขียว, ลด=ขาว
                btnInc.className = 'flex-1 py-2 px-3 rounded-lg border bg-green-500 text-white border-green-600 shadow-sm transition-all text-sm font-bold';
                btnExp.className = 'flex-1 py-2 px-3 rounded-lg border bg-white text-gray-600 border-gray-300 shadow-sm transition-all text-sm hover:bg-gray-50';
            });
            
            // กดปุ่ม "ลด (จ่าย)"
            btnExp.addEventListener('click', () => {
                getEl('adjust-tx-type').value = 'expense';
                // เปลี่ยนสีปุ่ม: เพิ่ม=ขาว, ลด=แดง
                btnExp.className = 'flex-1 py-2 px-3 rounded-lg border bg-red-500 text-white border-red-600 shadow-sm transition-all text-sm font-bold';
                btnInc.className = 'flex-1 py-2 px-3 rounded-lg border bg-white text-gray-600 border-gray-300 shadow-sm transition-all text-sm hover:bg-gray-50';
            });
        }

        getEl('icon-modal-save-btn').addEventListener('click', async () => {
            const accountId = getEl('edit-icon-account-id').value;
            const newIconName = getEl('icon-preview').getAttribute('data-current-icon');
            const accIndex = state.accounts.findIndex(a => a.id === accountId);

            if (accIndex === -1) {
                Swal.fire('ข้อผิดพลาด', 'ไม่พบบัญชี', 'error');
                return;
            }
            
            const oldAccount = JSON.parse(JSON.stringify(state.accounts[accIndex]));
            state.accounts[accIndex].iconName = newIconName;
            
            try {
                await dbPut(STORE_ACCOUNTS, state.accounts[accIndex]);
                setLastUndoAction({ type: 'account-edit', oldData: oldAccount, newData: state.accounts[accIndex] });
                closeIconModal();
                renderAccountSettingsList();
                if (currentPage === 'home') renderAll();
                Swal.fire('สำเร็จ', 'บันทึกไอคอนเรียบร้อยแล้ว', 'success');
            } catch (err) {
                console.error("Failed to save icon:", err);
                Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกไอคอนได้', 'error');
            }
        });
       
        getEl('account-form').addEventListener('submit', (e) => {
            e.preventDefault();
            handleEditAccountSubmit(e); 
        });


        getEl('form-add-income-cat').addEventListener('submit', handleAddCategory);
        getEl('form-add-expense-cat').addEventListener('submit', handleAddCategory);
        getEl('list-income-cat').addEventListener('click', (e) => {
            const btn = e.target.closest('.delete-cat-btn');
            if (btn) handleDeleteCategory(btn);
        });
        getEl('list-expense-cat').addEventListener('click', (e) => {
            const btn = e.target.closest('.delete-cat-btn');
            if (btn) handleDeleteCategory(btn);
        });
        getEl('form-add-frequent-item').addEventListener('submit', handleAddFrequentItem);
        getEl('list-frequent-item').addEventListener('click', (e) => {
            const btn = e.target.closest('.delete-item-btn');
            if (btn) handleDeleteFrequentItem(btn);
        });
        getEl('btn-backup').addEventListener('click', handleBackup);
		const btnUpdate = document.getElementById('btn-system-update');
		if (btnUpdate) btnUpdate.addEventListener('click', handleSystemUpdate);
        getEl('btn-import').addEventListener('click', () => getEl('import-file-input').click());
        getEl('import-file-input').addEventListener('change', handleImport);
        getEl('btn-clear-all').addEventListener('click', handleClearAll);
		const btnHardReset = document.getElementById('btn-hard-reset');
		if (btnHardReset) {
			btnHardReset.addEventListener('click', handleHardReset);
		}
        getEl('btn-manage-password').addEventListener('click', handleManagePassword);
        
        const toggleBalanceBtn = getEl('toggle-show-balance');
        if(toggleBalanceBtn) {
            toggleBalanceBtn.checked = state.showBalanceCard;

            toggleBalanceBtn.addEventListener('change', async (e) => {
                const isChecked = e.target.checked;
                state.showBalanceCard = isChecked;
                
                try {
                    await dbPut(STORE_CONFIG, { key: 'showBalanceCard', value: isChecked });
                    
                    if (currentPage === 'home') {
                        renderAll();
                    }
                } catch (err) {
                    console.error("Failed to save config:", err);
                }
            });
        }

        setupDarkModeListener();
		
		// +++ เพิ่มส่วนนี้ +++
        const toggleAutoConfirmBtn = getEl('toggle-auto-confirm-password');
        if (toggleAutoConfirmBtn) {
            toggleAutoConfirmBtn.addEventListener('change', async (e) => {
                const isChecked = e.target.checked;
                state.autoConfirmPassword = isChecked;
                try {
                    await dbPut(STORE_CONFIG, { key: AUTO_CONFIRM_CONFIG_KEY, value: isChecked });
                    
                    /// แจ้งเตือนเล็กน้อย (แบบใหม่)
                    const msg = isChecked ? "เปิดยืนยันอัตโนมัติ" : "ปิดยืนยันอัตโนมัติ";
                    showToast(msg, "success");

                } catch (err) {
                    console.error("Failed to save config:", err);
                }
            });
        }

        getEl('btn-undo').addEventListener('click', handleUndo);
        getEl('btn-redo').addEventListener('click', handleRedo);
        getEl('cal-prev-btn').addEventListener('click', () => {
            if (myCalendar) myCalendar.prev(); 
        });
        getEl('cal-next-btn').addEventListener('click', () => {
            if (myCalendar) myCalendar.next(); 
        });
        getEl('cal-year-input').addEventListener('change', (e) => {
            if (myCalendar) {
                const newYear = parseInt(e.target.value);
                if (!isNaN(newYear)) {
                    const currentDate = myCalendar.getDate(); 
                    const newDate = new Date(newYear, currentDate.getMonth(), 1);
                    myCalendar.gotoDate(newDate);
                }
            }
        });
		// --- [โค้ดใหม่: รองรับทั้งคลิกปกติ และ จิ้มแช่ (Long Press)] ---
        const accContainer = getEl('all-accounts-summary');
        let pressTimer;
        let isLongPress = false; // ตัวแปรเช็คสถานะ

        // เมื่อเริ่มกด (ทั้งเมาส์และนิ้ว)
        const handlePressStart = (e) => {
            const card = e.target.closest('.compact-account-card');
            if (!card) return;

            isLongPress = false;
            // ตั้งเวลา 800ms (0.8 วินาที) ถ้ากดค้างเกินนี้จะถือเป็น Long Press
            pressTimer = setTimeout(() => {
                isLongPress = true;
                const accountId = card.dataset.id;
                const accountName = state.accounts.find(a => a.id === accountId)?.name || '';

                // สั่นเตือนเล็กน้อย (ถ้ามือถือรองรับ)
                if (navigator.vibrate) navigator.vibrate(50);
                
                // แสดง Popup ยืนยันการ Backup
                Swal.fire({
                    title: `Backup: ${accountName}`,
                    text: 'ต้องการดาวน์โหลดประวัติธุรกรรม (Excel) ของบัญชีนี้ใช่ไหม?',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: '<i class="fa-solid fa-file-Excel"></i> ดาวน์โหลด Excel',
                    cancelButtonText: 'ยกเลิก',
                    confirmButtonColor: '#10b981' // สีเขียว
                }).then((result) => {
                    if (result.isConfirmed) {
                        exportAccountExcel(accountId);
                    }
                });
            }, 800); 
        };

        // เมื่อปล่อยมือ หรือ ขยับนิ้ว (ถือว่ายกเลิกการจิ้มแช่)
        const handlePressEnd = () => {
            clearTimeout(pressTimer);
        };

        accContainer.addEventListener('mousedown', handlePressStart);
        accContainer.addEventListener('touchstart', handlePressStart, { passive: true });

        ['mouseup', 'mouseleave', 'touchend', 'touchmove'].forEach(evt => {
            accContainer.addEventListener(evt, handlePressEnd);
        });

        // จัดการเหตุการณ์ Click (จะทำงานเฉพาะตอนที่ "ไม่ใช่" การจิ้มแช่)
        accContainer.addEventListener('click', (e) => {
            if (isLongPress) {
                // ถ้าเป็นการจิ้มแช่ -> หยุดการทำงาน (ไม่เปิดหน้ารายละเอียด)
                isLongPress = false; 
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            
            const card = e.target.closest('.compact-account-card');
            if (card) {
                const accountId = card.dataset.id;
                if (accountId) {
                    showAccountDetailModal(accountId);
                }
            }
        });
        
        getEl('account-detail-modal-close-btn').addEventListener('click', closeAccountDetailModal);
        
        // +++ ADDED NEW: Listener for buttons inside Account Detail Modal +++
        getEl('account-detail-modal-body').addEventListener('click', (e) => {
            const viewReceiptBtn = e.target.closest('.view-receipt-icon');
            const editBtn = e.target.closest('.edit-btn');     // +++ เพิ่ม
            const deleteBtn = e.target.closest('.delete-btn'); // +++ เพิ่ม

            if (viewReceiptBtn) handleViewReceiptClick(viewReceiptBtn);
            if (editBtn) handleEditClick(editBtn);       // +++ เรียกฟังก์ชันแก้ไข
            if (deleteBtn) handleDeleteClick(deleteBtn); // +++ เรียกฟังก์ชันลบ
        });
        // +++ END ADDED NEW +++
        
        getEl('add-tx-from-account-btn').addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if(btn && btn.dataset.accountId){
                closeAccountDetailModal();
                openModal(null, btn.dataset.accountId);
            }
        });
        getEl('tx-name').addEventListener('input', (e) => {
            const val = e.target.value.trim();
            const type = document.querySelector('input[name="tx-type"]:checked').value;
            
            const learnedItem = state.autoCompleteList.find(item => item.name === val && item.type === type);
            
            const hintEl = getEl('auto-fill-hint');
            
            if (learnedItem) {
                getEl('tx-category').value = learnedItem.category;
                
                // +++ แก้ไข: เช็คก่อนว่าช่องจำนวนเงินว่างอยู่หรือไม่ +++
                const currentAmount = getEl('tx-amount').value;
                // ถ้ายังไม่มีเงิน หรือ เป็น 0 ค่อยเติมจากความจำ (ป้องกันการทับยอด OCR)
                if (!currentAmount || parseFloat(currentAmount) === 0) {
                    getEl('tx-amount').value = learnedItem.amount;
                }
                // +++++++++++++++++++++++++++++++++++++++++++++++
                
                hintEl.classList.remove('hidden');
            } else {
                hintEl.classList.add('hidden');
            }
            
            const toggleFavBtn = getEl('toggle-favorite-btn');
            const isFav = state.frequentItems.includes(val);
            toggleFavBtn.classList.toggle('text-yellow-500', isFav);
            toggleFavBtn.classList.toggle('text-gray-400', !isFav);
        });
        // ============================================
		// [แก้ไข] handleSummaryCardClick (ซิงค์วันที่ + ลบตัวเลือกเก่า)
		// ============================================
		function handleSummaryCardClick(type) {
			state.filterType = type;
			state.listCurrentPage = 1;

			// 1. ตั้งค่า Dropdown ประเภท (รายรับ/รายจ่าย)
			const advTypeDropdown = document.getElementById('adv-filter-type');
			if (advTypeDropdown) {
				advTypeDropdown.value = type;
			}
			state.advFilterType = type;

			// 2. [NEW] ซิงค์ช่วงวันที่จากหน้า Home มาใส่ตัวกรอง Advanced
			// (เพื่อให้กดแล้วเจอข้อมูลของเดือนที่ดูอยู่ทันที)
			const d = new Date(state.homeCurrentDate);
			const y = d.getFullYear();
			const m = d.getMonth();

			if (state.homeViewMode === 'month') {
				// ถ้าหน้าแรกดูรายเดือน -> ตั้งค่าเป็น วันแรก-วันสุดท้ายของเดือนนั้น
				state.advFilterStart = new Date(y, m, 1).toISOString().slice(0, 10);
				state.advFilterEnd = new Date(y, m + 1, 0).toISOString().slice(0, 10);
			} else if (state.homeViewMode === 'year') {
				// ถ้าหน้าแรกดูรายปี -> ตั้งค่าเป็น 1 ม.ค. - 31 ธ.ค.
				state.advFilterStart = new Date(y, 0, 1).toISOString().slice(0, 10);
				state.advFilterEnd = new Date(y, 11, 31).toISOString().slice(0, 10);
			} else {
				// ถ้าดูทั้งหมด -> ล้างวันที่
				state.advFilterStart = '';
				state.advFilterEnd = '';
			}

			// อัปเดตค่าลงใน Input วันที่บนหน้าจอ
			const startEl = document.getElementById('adv-filter-start');
			const endEl = document.getElementById('adv-filter-end');
			if (startEl) startEl.value = state.advFilterStart;
			if (endEl) endEl.value = state.advFilterEnd;

			// 3. เปลี่ยนหน้าและแสดงผล
			updateSharedControls('list'); // (ถ้าฟังก์ชันนี้ยังมีอยู่ ถ้าไม่มีก็ข้ามได้)
			showPage('page-list');
			
			if (typeof renderListPage === 'function') {
				renderListPage();
			}
		}

        getEl('summary-income-card').addEventListener('click', () => handleSummaryCardClick('income'));
        getEl('summary-expense-card').addEventListener('click', () => handleSummaryCardClick('expense'));
        getEl('summary-balance-card').addEventListener('click', () => handleSummaryCardClick('all'));
        
        getEl('acc-detail-view-mode-select').addEventListener('change', handleAccountDetailViewModeChange);
        getEl('acc-detail-month-picker').addEventListener('input', (e) => handleAccountDetailDateChange(e, 'month'));
        getEl('acc-detail-month-prev').addEventListener('click', () => navigateAccountDetailPeriod(-1, 'month'));
        getEl('acc-detail-month-next').addEventListener('click', () => navigateAccountDetailPeriod(1, 'month'));
        getEl('acc-detail-year-picker').addEventListener('input', (e) => handleAccountDetailDateChange(e, 'year'));
        getEl('acc-detail-year-prev').addEventListener('click', () => navigateAccountDetailPeriod(-1, 'year'));
        getEl('acc-detail-year-next').addEventListener('click', () => navigateAccountDetailPeriod(1, 'year'));
		const modalVoiceBtn = getEl('modal-voice-btn');
				if (modalVoiceBtn) {
					if (SpeechRecognition) {
						const triggerVoice = (e) => {
							if (e.type === 'touchstart') {
								e.preventDefault();
							}
							startModalVoiceRecognition();
						};

						modalVoiceBtn.addEventListener('click', triggerVoice);
						modalVoiceBtn.addEventListener('touchstart', triggerVoice, { passive: false });
					} else {
						console.warn("Speech API not supported.");
						modalVoiceBtn.style.display = 'none'; 
					}
				}
        getEl('toggle-favorite-btn').addEventListener('click', handleToggleFavorite);
		
		// [3] ดักจับการเลื่อน Slider (แก้ใหม่: แค่เปลี่ยนชื่อป้ายกำกับ ยังไม่เปลี่ยนขนาดจริง)
		const fontSlider = document.getElementById('fontSizeSlider');
		if (fontSlider) {
			fontSlider.addEventListener('input', (e) => {
				const index = parseInt(e.target.value);
				// updateAppFont(index);  <-- คอมเมนต์บรรทัดนี้ออก (ไม่ให้เปลี่ยนทันที)
				updateFontLabel(index);   // เปลี่ยนแค่ข้อความโชว์ว่า "เล็ก", "ใหญ่" เฉยๆ
			});
		}

		// [เพิ่มใหม่] ดักจับปุ่มบันทึก
		const btnSaveFont = document.getElementById('btnSaveFontSize');
		if (btnSaveFont && fontSlider) {
			btnSaveFont.addEventListener('click', () => {
				const index = parseInt(fontSlider.value);
				
				// 1. เปลี่ยนขนาดจริงและบันทึกลง LocalStorage
				updateAppFont(index); 
				
				// 2. เรียกใช้ฟังก์ชัน showToast ที่มีอยู่แล้วในระบบ
				// พารามิเตอร์: (ข้อความ, ไอคอน) -> ไอคอนมี 'success', 'error', 'info'
				showToast('บันทึกขนาดตัวอักษรเรียบร้อย', 'success');
			});
		}
		
		// 1.6 [NEW] Recurring Transactions Listeners (ใส่ต่อท้ายสุดใน setupEventListeners)
        // +++++++++++++++++++++++++++++++++++++++++++++++++++++
        
        // 1. จัดการการ Submit Form ของรายการประจำ
        const recForm = document.getElementById('recurring-form');
        if (recForm) {
            // ดักจับการเปลี่ยนประเภท (รายรับ/รายจ่าย) ในหน้า Recurring
            document.querySelectorAll('input[name="rec-type"]').forEach(radio => {
                radio.addEventListener('change', (e) => {
                    // ส่ง type ที่เลือก และ ID ของ dropdown เป้าหมาย ('rec-category')
                    updateCategoryDropdown(e.target.value, 'rec-category'); 
                });
            });

            recForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const getEl = (id) => document.getElementById(id);
                
                const id = getEl('rec-id').value;
                const name = getEl('rec-name').value.trim();
                const amount = parseFloat(getEl('rec-amount').value);
                // ดึงค่า type จาก input name="rec-type"
                const typeEl = document.querySelector('input[name="rec-type"]:checked');
                const type = typeEl ? typeEl.value : 'expense';
                
                const category = getEl('rec-category').value;
                const accountId = getEl('rec-account').value;
                const frequency = getEl('rec-frequency').value;
                const startDate = getEl('rec-start-date').value;

                if (!name || isNaN(amount) || amount <= 0) {
                    Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อและจำนวนเงินที่ถูกต้อง', 'warning');
                    return;
                }

                const rule = {
                    id: id || `rec-${Date.now()}`,
                    name, amount, type, category, accountId, frequency,
                    nextDueDate: startDate, 
                    active: true
                };

                try {
                    await dbPut(STORE_RECURRING, rule);
                    
                    // อัปเดต State
                    if (id) {
                        const idx = state.recurringRules.findIndex(r => r.id === id);
                        if (idx !== -1) state.recurringRules[idx] = rule;
                    } else {
                        state.recurringRules.push(rule);
                    }

                    closeRecurringModal(); 
                    
                    if (typeof renderRecurringSettings === 'function') {
                        renderRecurringSettings();
                    }
                    
                    Swal.fire('บันทึกสำเร็จ', 'ตั้งค่ารายการประจำเรียบร้อยแล้ว', 'success');
                    
                    // ลองประมวลผลทันทีเผื่อถึงกำหนดวันนี้
                    if (typeof checkAndProcessRecurring === 'function') {
                        await checkAndProcessRecurring();
                    }

                } catch (err) {
                    console.error(err);
                    Swal.fire('Error', 'บันทึกไม่สำเร็จ', 'error');
                }
            });

            // 3. ปุ่มปิด Modal
            const closeBtn = document.getElementById('rec-modal-close-btn');
            if(closeBtn) closeBtn.addEventListener('click', closeRecurringModal);
            
            const cancelBtn = document.getElementById('rec-modal-cancel-btn');
            if(cancelBtn) cancelBtn.addEventListener('click', closeRecurringModal);
        }

		// 4. ปุ่มเปิดเมนู Recurring ในหน้า Settings
		const btnManageRecurring = document.getElementById('btn-manage-recurring');
		if (btnManageRecurring) {
			btnManageRecurring.addEventListener('click', () => {
				 const container = document.getElementById('settings-recurring-content');
				 const icon = btnManageRecurring.querySelector('.fa-chevron-down');
				 
				 container.classList.toggle('hidden');
				 
				 if (!container.classList.contains('hidden')) {
					 icon.classList.add('rotate-180');
					 if (typeof renderRecurringSettings === 'function') {
						renderRecurringSettings();
					 }
				 } else {
					 icon.classList.remove('rotate-180');
				 }
			});
		}
		
		const txRecurringCheckbox = document.getElementById('tx-is-recurring');
        const txRecurringOptions = document.getElementById('tx-recurring-options');
        
        if (txRecurringCheckbox && txRecurringOptions) {
            txRecurringCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    txRecurringOptions.classList.remove('hidden');
                } else {
                    txRecurringOptions.classList.add('hidden');
                }
            });
        }
		
		// 1. เพิ่ม listener ให้ form budget
        const budgetForm = document.getElementById('form-add-budget');
        if (budgetForm) budgetForm.addEventListener('submit', handleAddBudget);

        // 2. เรียกใช้ฟังก์ชันเตรียม dropdown เมื่อเปิดหน้า Settings
        const navSettingsBtn = document.getElementById('nav-settings');
        if (navSettingsBtn) {
            navSettingsBtn.addEventListener('click', () => {
                populateBudgetCategoryDropdown(); // [NEW]
                renderBudgetSettingsList();       // [NEW]
            });
        }
        
        // (แถม) ทำให้ปุ่มเมนูมือถือทำงานด้วย
        const navSettingsMobileBtn = document.getElementById('nav-settings-mobile');
        if (navSettingsMobileBtn) {
            navSettingsMobileBtn.addEventListener('click', () => {
                populateBudgetCategoryDropdown(); 
                renderBudgetSettingsList();       
            });
        }
		
		// 3. ลิ้งค์จาก Widget หน้าแรก ไปหน้าตั้งค่างบประมาณ (อัปเดตล่าสุด)
        const btnGoBudget = document.getElementById('btn-go-budget-settings');
			if (btnGoBudget) {
				btnGoBudget.addEventListener('click', () => {
					// 1. เปลี่ยนหน้าไป page-accounts
					showPage('page-accounts'); 
					
					// 2. สั่งให้เปิดส่วนตั้งค่างบประมาณ
					populateBudgetCategoryDropdown();
					renderBudgetSettingsList();

                    // 3. [แก้ไขใหม่] สั่งให้ขยาย (Expand) ส่วนงบประมาณแน่นอน โดยไม่ต้องรอลุ้น
                    const targetId = 'settings-budget-content';
                    const content = document.getElementById(targetId);
                    const header = document.querySelector(`.settings-toggle-header[data-target="${targetId}"]`);
                    
                    if (content && header) {
                        // บังคับเอา class hidden ออกเพื่อให้แสดงผล
                        content.classList.remove('hidden');
                        
                        // ปรับไอคอนให้ชี้ขึ้น (แสดงสถานะเปิด)
                        const icon = header.querySelector('i.fa-chevron-down');
                        if (icon) {
                            icon.classList.add('rotate-180');
                            icon.classList.remove('text-green-500');
                            icon.classList.add('text-red-500');
                        }
                        
                        // อัปเดต State ว่าเปิดอยู่ (เพื่อให้จำค่าไว้)
                        if (!state.settingsCollapse) state.settingsCollapse = {};
                        state.settingsCollapse[targetId] = true;
                        
                        // บันทึก State ลง DB (เพื่อให้ปิดแอพแล้วเปิดมายังจำได้)
                        dbPut(STORE_CONFIG, { key: 'collapse_preferences', value: state.settingsCollapse }).catch(console.error);
                    }

					// 4. เลื่อนหน้าจอลงมาที่ส่วนงบประมาณ (หน่วงเวลานิดนึงรอให้เปลี่ยนหน้าเสร็จ)
					if (content) {
                        setTimeout(() => {
						    content.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 300);
					}
				});
			}
			
			// 4. [NEW] คลิกที่รายการงบประมาณเพื่อดูรายละเอียด
		const budgetContainer = document.getElementById('budget-list-container');
		if (budgetContainer) {
			budgetContainer.addEventListener('click', (e) => {
				const item = e.target.closest('.budget-item-click');
				if (item) {
					const category = item.dataset.category;
					
					// 1. ตั้งค่าการค้นหาเป็นชื่อหมวดหมู่ (แก้ไข ID ให้ถูกต้องเป็น adv-filter-search)
					state.searchTerm = category;
					const searchInput = document.getElementById('adv-filter-search');
					if (searchInput) searchInput.value = category;

					// 2. ตั้งค่ามุมมองรายการเป็น "รายเดือน" และประเภท "รายจ่าย"
					state.listViewMode = 'month';
					state.filterType = 'expense'; 
					state.advFilterType = 'expense';
					
					const typeSelect = document.getElementById('adv-filter-type');
					if (typeSelect) typeSelect.value = 'expense';
					
					// 3. [แก้ไขจุดนี้] คำนวณและตั้งค่าวันเริ่มต้น-สิ้นสุด เป็นเดือนปัจจุบัน (วันที่ 1 - สิ้นเดือน)
					state.listCurrentDate = state.homeCurrentDate; // ใช้วันที่เดียวกับหน้า Home

					const d = new Date(state.homeCurrentDate);
					const y = d.getFullYear();
					const m = d.getMonth();
					
					// สร้างวันที่ 1 ของเดือน และ วันสุดท้ายของเดือน
					const firstDay = new Date(y, m, 1);
					const lastDay = new Date(y, m + 1, 0);
					
					// ฟังก์ชันแปลงวันที่เป็น YYYY-MM-DD
					const formatDate = (date) => {
						let month = '' + (date.getMonth() + 1),
							day = '' + date.getDate(),
							year = date.getFullYear();
						if (month.length < 2) month = '0' + month;
						if (day.length < 2) day = '0' + day;
						return [year, month, day].join('-');
					};
					
					const startStr = formatDate(firstDay);
					const endStr = formatDate(lastDay);
					
					// อัปเดตค่าลงใน State และ Input บนหน้าจอทันที
					state.advFilterStart = startStr;
					state.advFilterEnd = endStr;
					
					const startInput = document.getElementById('adv-filter-start');
					const endInput = document.getElementById('adv-filter-end');
					if (startInput) startInput.value = startStr;
					if (endInput) endInput.value = endStr;

					// 4. อัปเดต UI ปุ่มกรองให้แสดงว่าเลือก "รายจ่าย" อยู่
					document.querySelectorAll('#list-filter-buttons .filter-btn').forEach(btn => { // หมายเหตุ: ตรวจสอบว่า ID ปุ่มถูกต้องตาม HTML หรือไม่
						// ถ้าใน index.html ไม่มี list-filter-buttons อาจข้ามส่วนนี้ได้ แต่โค้ดหลักคือข้อ 3
					});

					// 5. เปลี่ยนหน้าไปที่ List
					showPage('page-list');
					
					// 6. เรนเดอร์รายการใหม่
					renderListPage();
				}
			});
		}
		
		// +++ จัดการปุ่ม Back ของ Browser/Mobile +++
        window.addEventListener('popstate', (event) => {
            
            // 1. [NEW] เช็คก่อนว่ามี SweetAlert2 (Popup ใส่รหัสผ่าน/แจ้งเตือน) เปิดอยู่ไหม
            // ถ้ามี ให้ปิด Swal ก่อน แล้วดัน State กลับเพื่อไม่ให้เปลี่ยนหน้า
            if (typeof Swal !== 'undefined' && Swal.isVisible()) {
                Swal.close(); // สั่งปิด Popup รหัสผ่าน หรือ Alert ต่างๆ
                
                // ดัน URL ปัจจุบันกลับเข้าไปใหม่ เพื่อให้ยังอยู่หน้าเดิม (เพราะปุ่ม Back มันพาเราถอยไปแล้ว)
                if (event.state && event.state.pageId) {
                     history.pushState({ pageId: event.state.pageId }, null, `#${event.state.pageId.replace('page-', '')}`);
                } else {
                     history.pushState({ pageId: 'page-home' }, null, '#home');
                }
                return; // จบการทำงาน ไม่ต้องไปเช็ค Modal อื่นต่อ
            }

            // 2. ถ้าไม่มี Swal เปิดอยู่ ให้เช็ค Modal ปกติของแอป
            const modals = [
                'form-modal', 'account-form-modal', 'account-detail-modal', 
                'icon-form-modal', 'recurring-form-modal', 'app-lock-screen'
            ];
            
            // เช็คว่ามี Modal ไหนเปิดอยู่ไหม (และไม่ใช่ Lock Screen)
            for (const modalId of modals) {
                const el = document.getElementById(modalId);
                if (el && !el.classList.contains('hidden')) {
                    // ยกเว้น Lock Screen ห้ามปิดด้วยปุ่ม Back (ต้องใส่รหัสเท่านั้น)
                    if (modalId === 'app-lock-screen') {
                        // ถ้าติด Lock Screen ให้ดัน State กลับมาที่เดิม (กัน user หนี)
                        history.pushState(null, null, location.href);
                        return;
                    }
                    
                    // ปิด Modal
                    el.classList.add('hidden');
                    
                    // ปิด Backdrop หรือ reset form เพิ่มเติมถ้าจำเป็น
                    if (modalId === 'form-modal') closeModal(); 
                    if (modalId === 'account-form-modal') openAccountModal(null, true);
                    if (modalId === 'account-detail-modal') closeAccountDetailModal();
                    if (modalId === 'recurring-form-modal') closeRecurringModal();
                    if (modalId === 'icon-form-modal') closeIconModal();
                    
                    // เนื่องจากปุ่ม Back มันเปลี่ยน URL ไปแล้ว แต่เราแค่ปิด Modal
                    // เราจึงต้อง "ดัน" URL ปัจจุบันกลับเข้าไปใหม่ เพื่อให้ยังอยู่หน้าเดิม
                    if (event.state && event.state.pageId) {
                         history.pushState({ pageId: event.state.pageId }, null, `#${event.state.pageId.replace('page-', '')}`);
                    } else {
                         // ถ้าไม่มี state (หน้าแรก)
                         history.pushState({ pageId: 'page-home' }, null, '#home');
                    }
                    return; // จบการทำงาน ไม่ต้องเปลี่ยนหน้า
                }
            }

            // 3. ถ้าไม่มี Modal หรือ Popup ใดๆ เปิดอยู่เลย ให้เปลี่ยนหน้าตามปกติ
            if (event.state && event.state.pageId) {
                // เรียก showPage แบบ addToHistory = false (เพื่อไม่ให้ loop)
                showPage(event.state.pageId, false);
            } else {
                // ถ้า History หมดแล้ว ให้กลับไปหน้า Home
                showPage('page-home', false);
            }
        });
		
		// =======================================================
		// ป้องกันการรีเฟรช (Prevent Refresh Logic)
		// =======================================================
		
		// 1. ดักจับปุ่ม F5 และ Ctrl+R (สำหรับ Desktop)
		document.addEventListener('keydown', (e) => {
			if (
				(e.key === 'F5') || 
				(e.ctrlKey && e.key === 'r') || 
				(e.metaKey && e.key === 'r')
			) {
				e.preventDefault();
				// แสดง Toast แจ้งเตือน (แบบใหม่)
				showToast("ระบบป้องกันการรีเฟรชหน้าจอ", "warning");
			}
		});
		
		// 2. แจ้งเตือนเมื่อพยายามจะปิดหรือรีเฟรช (Browser Confirmation)
		// หมายเหตุ: Browser สมัยใหม่จะบังคับให้แสดงข้อความมาตรฐานของ Browser เท่านั้น เปลี่ยนข้อความเองไม่ได้
		window.addEventListener('beforeunload', (e) => {
			// เช็คว่ามี Modal หรือ Form เปิดค้างอยู่ไหม ถ้ามีให้เตือน
			const isFormOpen = !document.getElementById('form-modal').classList.contains('hidden');
			const isRecFormOpen = !document.getElementById('recurring-form-modal').classList.contains('hidden');
			
			if (isFormOpen || isRecFormOpen) {
				e.preventDefault();
				e.returnValue = ''; // จำเป็นสำหรับ Chrome
				return '';
			}
		});
		
		// [เพิ่มใหม่] --- Biometric Buttons ---
        // 1. ปุ่มตั้งค่าในหน้า Settings
        const bioBtn = document.getElementById('btn-biometric-settings');
        if (bioBtn) {
            bioBtn.addEventListener('click', () => {
                if (state.biometricId) {
                    removeBiometric();
                } else {
                    registerBiometric();
                }
            });
        }

        // 2. ปุ่มสแกนหน้า Lock Screen
        const bioUnlockBtn = document.getElementById('btn-bio-unlock');
        if (bioUnlockBtn) {
            bioUnlockBtn.addEventListener('click', async () => {
                const success = await verifyBiometricIdentity();
                if (success) {
                    unlockAppSuccess(); 
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'ไม่ผ่าน',
                        text: 'ไม่สามารถยืนยันตัวตนได้',
                        timer: 1500,
                        showConfirmButton: false
                    });
                }
            });
        }
		
		// Line User ID
		const btnSaveLineId = getEl('btn-save-line-id');
		if (btnSaveLineId) {
			btnSaveLineId.addEventListener('click', async () => {
				const input = getEl('input-line-user-id');
				const val = input.value.trim();
				
				if (!val.startsWith('U') || val.length < 30) {
					Swal.fire('รูปแบบไม่ถูกต้อง', 'User ID ต้องขึ้นต้นด้วยตัว U และมีความยาว 33 ตัวอักษร', 'warning');
					return;
				}

				try {
					await dbPut(STORE_CONFIG, { key: LINE_USER_ID_KEY, value: val });
					state.lineUserId = val; // อัปเดต State ถ้ามี
					Swal.fire('บันทึกสำเร็จ', 'ตั้งค่า LINE User ID เรียบร้อยแล้ว', 'success');
				} catch (err) {
					console.error(err);
					Swal.fire('Error', 'บันทึกไม่สำเร็จ', 'error');
				}
			});
		}
		
		// เรียกใช้ฟังก์ชันปุ่ม Install
        setupInstallButton();
		
		// [ใหม่] --- ส่วนจัดการการแจ้งเตือน (Notifications) ---
    
        // 1. Toggle Settings (สวิตช์เปิด-ปิด)
        const toggleSch = document.getElementById('toggle-notify-scheduled');
        if (toggleSch) {
            toggleSch.checked = state.notifySettings.scheduled;
            toggleSch.addEventListener('change', async (e) => {
                state.notifySettings.scheduled = e.target.checked;
                await dbPut(STORE_CONFIG, { key: 'notification_settings', value: state.notifySettings });
            });
        }

        const toggleRec = document.getElementById('toggle-notify-recurring');
        if (toggleRec) {
            toggleRec.checked = state.notifySettings.recurring;
            toggleRec.addEventListener('change', async (e) => {
                state.notifySettings.recurring = e.target.checked;
                await dbPut(STORE_CONFIG, { key: 'notification_settings', value: state.notifySettings });
            });
        }

        const toggleBud = document.getElementById('toggle-notify-budget');
        if (toggleBud) {
            toggleBud.checked = state.notifySettings.budget;
            toggleBud.addEventListener('change', async (e) => {
                state.notifySettings.budget = e.target.checked;
                await dbPut(STORE_CONFIG, { key: 'notification_settings', value: state.notifySettings });
            });
        }

        // 2. Custom Notification Save (ปุ่มบันทึกแจ้งเตือนพิเศษ)
        // Listener สำหรับปุ่มบันทึก (ปรับปรุงใหม่)
        const btnSaveCustom = document.getElementById('btn-save-custom-notify');
		if (btnSaveCustom) {
			btnSaveCustom.addEventListener('click', async () => {
				const msg = document.getElementById('custom-notify-msg').value.trim();
				const date = document.getElementById('custom-notify-date').value;
				const days = document.getElementById('custom-notify-days').value;
				
				// [จุดสำคัญ 1] ต้องดึงค่าจาก Dropdown ทำซ้ำ
				const repeatEl = document.getElementById('custom-notify-repeat'); 
				const repeat = repeatEl ? repeatEl.value : 'none'; 
				
				const timeTypeEl = document.querySelector('input[name="notify-time-type"]:checked');
				const timeType = timeTypeEl ? timeTypeEl.value : 'all1day';
				let specificTime = null;

				if (!msg || !date) {
					Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกข้อความและวันที่', 'warning');
					return;
				}
				if (timeType === 'specific') {
					specificTime = document.getElementById('custom-notify-time').value;
					if (!specificTime) {
						Swal.fire('ข้อมูลไม่ครบ', 'กรุณาระบุเวลา', 'warning'); return;
					}
				}

				const editIdx = btnSaveCustom.dataset.editIdx;
				const notifyObj = {
					message: msg,
					date: date,
					advanceDays: days || 0,
					isAllDay: (timeType === 'all1day'),
					time: (timeType === 'all1day') ? '00:00' : specificTime,
					repeat: repeat // [จุดสำคัญ 2] ต้องบันทึกค่า repeat ลง Object
				};

				if (editIdx !== undefined) {
					const idx = parseInt(editIdx);
					state.customNotifications[idx] = { ...state.customNotifications[idx], ...notifyObj };
					Swal.fire('แก้ไขสำเร็จ', 'อัปเดตข้อมูลเรียบร้อยแล้ว', 'success');
				} else {
					state.customNotifications.push({ id: 'custom_' + Date.now(), ...notifyObj });
					Swal.fire('สำเร็จ', 'เพิ่มการแจ้งเตือนแล้ว', 'success');
				}

				await dbPut(STORE_CONFIG, { key: 'custom_notifications_list', value: state.customNotifications });
				resetCustomNotifyForm();
				renderCustomNotifyList();
				renderCalendarView(); // สั่งรีเฟรชปฏิทินทันที
			});
		}
		
		// [เพิ่มใหม่] จัดการแสดงช่องเลือกเวลาแจ้งเตือน
		const notifyTimeRadios = document.querySelectorAll('input[name="notify-time-type"]');
		const notifyTimeWrapper = document.getElementById('notify-time-input-wrapper');

		if (notifyTimeRadios.length > 0 && notifyTimeWrapper) {
			notifyTimeRadios.forEach(radio => {
				radio.addEventListener('change', (e) => {
					if (e.target.value === 'specific') {
						notifyTimeWrapper.classList.remove('hidden');
					} else {
						notifyTimeWrapper.classList.add('hidden');
					}
				});
			});
		}

        // เรียก render รายการแจ้งเตือนพิเศษ เมื่อกดเข้าเมนู Settings
        const navSettingsBtnForNotify = document.getElementById('nav-settings');
        if (navSettingsBtnForNotify) {
            navSettingsBtnForNotify.addEventListener('click', () => {
                if(typeof renderCustomNotifyList === 'function') {
                    renderCustomNotifyList();
                }
            });
        }
		
		// ฟังก์ชันแสดงรายการประวัติ
		function renderNotificationHistory() {
			const list = document.getElementById('notification-history-list');
			if (!list) return;

			if (state.notificationHistory.length === 0) {
				list.innerHTML = '<p class="text-center text-gray-400 py-4 text-sm">ยังไม่มีประวัติการแจ้งเตือน</p>';
				return;
			}

			// เรียงลำดับจากใหม่ไปเก่า (ล่าสุดอยู่บน)
			const sortedHistory = [...state.notificationHistory].reverse();

			list.innerHTML = sortedHistory.map(h => `
				<div class="flex items-start gap-3 bg-white p-3 rounded-lg border border-gray-100 shadow-sm text-sm mb-2">
					<div class="${h.color || 'text-gray-500'} mt-0.5 text-lg">
						<i class="fa-solid ${h.icon || 'fa-bell'}"></i>
					</div>
					<div class="flex-1">
						<div class="flex justify-between items-start">
							<span class="font-bold text-gray-700">${h.title}</span>
							<span class="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">${h.date} ${h.time}</span>
						</div>
						<div class="text-gray-600 mt-1">${h.message}</div>
					</div>
				</div>
			`).join('');
		}

		// เพิ่ม Event Listener สำหรับปุ่ม History
		document.addEventListener('DOMContentLoaded', () => {
			// ปุ่มเปิด-ปิดดูประวัติ
			const btnToggleHist = document.getElementById('btn-toggle-history');
			const histList = document.getElementById('notification-history-list');
			
			if (btnToggleHist && histList) {
				btnToggleHist.addEventListener('click', () => {
					histList.classList.toggle('hidden');
					if (!histList.classList.contains('hidden')) {
						btnToggleHist.textContent = 'ซ่อนประวัติ';
						// เรียก render ทุกครั้งที่กดเปิด เพื่อให้ข้อมูลอัปเดตเสมอ
						if(typeof renderNotificationHistory === 'function') {
							renderNotificationHistory();
						}
					} else {
						btnToggleHist.textContent = 'แสดงประวัติที่ผ่านมา';
					}
				});
			}
		});
		
		// ==========================================
        // ส่วนจัดการการแจ้งเตือนพิเศษ (แก้ไขใหม่ให้รองรับ Edit)
        // ==========================================

        // ฟังก์ชันล้างฟอร์มและรีเซ็ตปุ่มกลับเป็นโหมดปกติ
        function resetCustomNotifyForm() {
            document.getElementById('custom-notify-msg').value = '';
            document.getElementById('custom-notify-date').value = '';
            document.getElementById('custom-notify-days').value = '0';
            document.getElementById('custom-notify-time').value = '';
			document.getElementById('custom-notify-repeat').value = 'none'; // [เพิ่ม] รีเซ็ตค่าทำซ้ำ
            
            // รีเซ็ต Radio กลับไปเป็น All Day
            const radioAllDay = document.querySelector('input[name="notify-time-type"][value="allday"]');
            if(radioAllDay) {
                radioAllDay.checked = true;
                radioAllDay.dispatchEvent(new Event('change')); // Trigger ให้ซ่อนช่องเวลา
            }

            // รีเซ็ตปุ่มบันทึกกลับเป็นสีม่วง (โหมดเพิ่ม)
            const saveBtn = document.getElementById('btn-save-custom-notify');
            if (saveBtn) {
                saveBtn.innerHTML = 'บันทึกการแจ้งเตือน';
                saveBtn.classList.add('bg-purple-600', 'hover:bg-purple-700');
                saveBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                delete saveBtn.dataset.editIdx; // ลบตัวบ่งชี้การแก้ไข
            }

            // ซ่อนปุ่มยกเลิก
            const cancelBtn = document.getElementById('btn-cancel-custom-notify');
            if (cancelBtn) cancelBtn.remove();
        }

        // ฟังก์ชันสำหรับโหลดข้อมูลมาแก้ไข (เรียกเมื่อกดปุ่มดินสอ)
        window.handleEditCustomNotify = (idx) => {
            const item = state.customNotifications[idx];
            if (!item) return;

            // ดึงข้อมูลมาใส่ฟอร์ม
            document.getElementById('custom-notify-msg').value = item.message;
            document.getElementById('custom-notify-date').value = item.date;
            document.getElementById('custom-notify-days').value = item.advanceDays || 0;
			
			// [เพิ่ม] โหลดค่าทำซ้ำมาใส่ Dropdown
			document.getElementById('custom-notify-repeat').value = item.repeat || 'none';

            // จัดการเวลา (ทั้งวัน vs ระบุเวลา)
            if (item.isAllDay) {
                const radio = document.querySelector('input[name="notify-time-type"][value="allday"]');
                if(radio) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change'));
                }
            } else {
                const radio = document.querySelector('input[name="notify-time-type"][value="specific"]');
                if(radio) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change'));
                }
                document.getElementById('custom-notify-time').value = item.time;
            }

            // เปลี่ยนปุ่มบันทึกเป็น "บันทึกการแก้ไข" (สีน้ำเงิน)
            const saveBtn = document.getElementById('btn-save-custom-notify');
            saveBtn.innerHTML = '<i class="fa-solid fa-pen-to-square mr-2"></i> บันทึกการแก้ไข';
            saveBtn.classList.remove('bg-purple-600', 'hover:bg-purple-700');
            saveBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
            saveBtn.dataset.editIdx = idx; // ฝังเลข Index ที่กำลังแก้อยู่ไว้ที่ปุ่ม

            // เพิ่มปุ่ม "ยกเลิก" ถ้ายังไม่มี
            let cancelBtn = document.getElementById('btn-cancel-custom-notify');
            if (!cancelBtn) {
                cancelBtn = document.createElement('button');
                cancelBtn.id = 'btn-cancel-custom-notify';
                cancelBtn.className = 'w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 rounded-xl shadow transition duration-300 mt-2';
                cancelBtn.innerHTML = 'ยกเลิกการแก้ไข';
                cancelBtn.addEventListener('click', resetCustomNotifyForm);
                saveBtn.parentNode.insertBefore(cancelBtn, saveBtn.nextSibling);
            }

            // เลื่อนหน้าจอขึ้นไปที่ฟอร์ม
            document.getElementById('custom-notify-msg').scrollIntoView({ behavior: 'smooth', block: 'center' });
            document.getElementById('custom-notify-msg').focus();
        };
		
		// 1. ฟังก์ชันแสดงรายการแจ้งเตือนพิเศษ (Custom Notify List)
		// ฟังก์ชันแสดงรายการ (ปรับปรุงให้มีปุ่ม Edit)
        function renderCustomNotifyList() {
            const list = document.getElementById('active-custom-notify-list');
            if(!list) return;
            list.innerHTML = '';
            
            if (!state.customNotifications || state.customNotifications.length === 0) {
                return;
            }
            
            const today = new Date().toISOString().slice(0, 10);
            
            state.customNotifications.forEach((n, idx) => {
                const isPassed = n.date < today; 
                const statusClass = isPassed 
                    ? 'text-gray-400 dark:text-gray-500 line-through' 
                    : 'text-purple-700 dark:text-purple-400';
                
                const dateObj = new Date(n.date);
                const dateStr = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });

                let timeDisplay = '';
                if (n.isAllDay === false && n.time) { 
                     timeDisplay = `<span class="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] ml-2 font-bold"><i class="fa-regular fa-clock mr-1"></i>${n.time} น.</span>`;
                } else {
                     timeDisplay = `<span class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] ml-2"><i class="fa-solid fa-sun mr-1"></i>ทั้งวัน</span>`;
                }
				
				// [เพิ่มใหม่] แสดงสถานะการทำซ้ำ (Badge)
				let repeatBadge = '';
				if (n.repeat && n.repeat !== 'none') {
					const repeatLabels = { 'weekly': 'ทุกสัปดาห์', 'monthly': 'ทุกเดือน', 'yearly': 'ทุกปี' };
					repeatBadge = `<span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] ml-1 font-bold border border-blue-200">
						<i class="fa-solid fa-rotate mr-1"></i>${repeatLabels[n.repeat]}
					</span>`;
				}

                const html = `
                    <div class="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-2 transition-colors">
                        <div class="${statusClass} flex-grow">
                            <div class="font-bold text-sm flex items-center flex-wrap gap-1">
                                ${n.message}
                                ${timeDisplay}
                            </div>
                            <div class="text-xs mt-1 text-gray-500 dark:text-gray-400">
                                <i class="fa-regular fa-calendar mr-1"></i>${dateStr} (เตือนก่อน ${n.advanceDays} วัน)
                            </div>
                        </div>
                        <div class="flex items-center gap-1 pl-2">
                            <button onclick="handleEditCustomNotify(${idx})" class="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 p-2 transition bg-blue-50 dark:bg-blue-900/20 rounded-lg" title="แก้ไข">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="text-red-500 hover:text-red-700 dark:hover:text-red-400 delete-custom-notify p-2 transition bg-red-50 dark:bg-red-900/20 rounded-lg" data-idx="${idx}" title="ลบ">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
                list.insertAdjacentHTML('beforeend', html);
            });

            // Listener สำหรับปุ่มลบ (เหมือนเดิม)
            document.querySelectorAll('.delete-custom-notify').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const targetBtn = e.target.closest('.delete-custom-notify'); 
                    if(!targetBtn) return;
                    const idx = targetBtn.dataset.idx;
                    
                    const confirm = await Swal.fire({
                        title: 'ลบรายการ?',
                        text: 'ต้องการลบการแจ้งเตือนนี้ใช่ไหม',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'ลบ',
                        cancelButtonText: 'ยกเลิก',
                        confirmButtonColor: '#d33',
                    });

                    if (confirm.isConfirmed) {
                        // ถ้ากำลังแก้ไขรายการที่ถูกลบ ให้รีเซ็ตฟอร์มด้วย
                        const saveBtn = document.getElementById('btn-save-custom-notify');
                        if (saveBtn && saveBtn.dataset.editIdx == idx) {
                            resetCustomNotifyForm();
                        }

                        state.customNotifications.splice(idx, 1);
                        await dbPut(STORE_CONFIG, { key: 'custom_notifications_list', value: state.customNotifications });
                        renderCustomNotifyList(); 
                    }
                });
            });
        }

		// 2. ฟังก์ชันแสดงประวัติการแจ้งเตือน (Notification History)
		function renderNotificationHistory() {
			const list = document.getElementById('notification-history-list');
			if (!list) return;

			if (!state.notificationHistory || state.notificationHistory.length === 0) {
				list.innerHTML = '<p class="text-center text-gray-400 dark:text-gray-500 py-4 text-sm">ยังไม่มีประวัติการแจ้งเตือน</p>';
				return;
			}

			const sortedHistory = [...state.notificationHistory].reverse();

			list.innerHTML = sortedHistory.map(h => `
				<div class="flex items-start gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm text-sm mb-2 transition-colors">
					<div class="${h.color || 'text-gray-500 dark:text-gray-400'} mt-0.5 text-lg">
						<i class="fa-solid ${h.icon || 'fa-bell'}"></i>
					</div>
					<div class="flex-1">
						<div class="flex justify-between items-start">
							<span class="font-bold text-gray-700 dark:text-gray-200">${h.title}</span>
							<span class="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full whitespace-nowrap">
								${h.date} ${h.time}
							</span>
						</div>
						<div class="text-gray-600 dark:text-gray-400 mt-1 text-xs">${h.message}</div>
					</div>
				</div>
			`).join('');
		}

		// 3. เรียกใช้งานปุ่มเปิด/ปิด History และปุ่มล้างประวัติ
		const btnToggleHist = document.getElementById('btn-toggle-history');
		const histList = document.getElementById('notification-history-list');
		
		if (btnToggleHist && histList) {
			btnToggleHist.addEventListener('click', () => {
				histList.classList.toggle('hidden');
				if (!histList.classList.contains('hidden')) {
					btnToggleHist.textContent = 'ซ่อนประวัติ';
					renderNotificationHistory();
				} else {
					btnToggleHist.textContent = 'แสดงประวัติที่ผ่านมา';
				}
			});
		}

		const btnClearHist = document.getElementById('btn-clear-history');
		if (btnClearHist) {
			btnClearHist.addEventListener('click', async () => {
				const confirm = await Swal.fire({
					title: 'ล้างประวัติ?',
					text: 'ประวัติทั้งหมดจะหายไป',
					icon: 'warning',
					showCancelButton: true,
					confirmButtonText: 'ล้างข้อมูล',
					cancelButtonText: 'ยกเลิก',
					confirmButtonColor: '#d33'
				});

				if (confirm.isConfirmed) {
					state.notificationHistory = [];
					await dbPut(STORE_CONFIG, { key: 'notification_history', value: [] });
					renderNotificationHistory();
					showToast('ล้างประวัติเรียบร้อย', 'success');
				}
			});
		}
		
		// --- ปุ่มล้างการแจ้งเตือนพิเศษที่เลยกำหนด (วางใน setupEventListeners) ---
		const btnClearCustomExpired = document.getElementById('btn-clear-custom-expired');
		
		if (btnClearCustomExpired) {
			btnClearCustomExpired.addEventListener('click', async () => {
				// 1. ตรวจสอบว่ามีรายการที่ต้องลบไหม
				const today = new Date().toISOString().slice(0, 10);
				
				// หาจำนวนรายการที่ "วันที่ < วันนี้" (คือรายการที่แจ้งเตือนไปแล้ว)
				const expiredCount = state.customNotifications.filter(n => n.date < today).length;
				
				if (expiredCount === 0) {
					Swal.fire('ไม่มีรายการเก่า', 'ไม่มีการแจ้งเตือนพิเศษที่เลยกำหนดให้ลบ', 'info');
					return;
				}

				// 2. ถามยืนยัน
				const confirm = await Swal.fire({
					title: 'ล้างรายการเก่า?',
					text: `พบ ${expiredCount} รายการที่แจ้งเตือนไปแล้ว คุณต้องการลบออกทั้งหมดหรือไม่?`,
					icon: 'question',
					showCancelButton: true,
					confirmButtonColor: '#d33',
					confirmButtonText: 'ลบรายการเก่า',
					cancelButtonText: 'ยกเลิก'
				});

				if (confirm.isConfirmed) {
					try {
						// 3. กรองเอาเฉพาะรายการที่ "ยังไม่ถึงกำหนด" หรือ "เป็นวันนี้" (date >= today)
						const activeNotifications = state.customNotifications.filter(n => n.date >= today);
						
						// อัปเดต State
						state.customNotifications = activeNotifications;
						
						// 4. บันทึกลง DB
						await dbPut(STORE_CONFIG, { key: 'custom_notifications_list', value: state.customNotifications });
						
						// 5. แสดงผลรายการใหม่ทันที
						if (typeof renderCustomNotifyList === 'function') {
							renderCustomNotifyList();
						}
						
						showToast(`ลบรายการเก่าเรียบร้อย (${expiredCount} รายการ)`, 'success');

					} catch (err) {
						console.error(err);
						Swal.fire('ข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
					}
				}
			});
		}

		// เรียกแสดงผลครั้งแรกเมื่อเข้าหน้า Settings
		const settingsBtn = document.getElementById('nav-settings');
		if (settingsBtn) {
			settingsBtn.addEventListener('click', () => {
				renderCustomNotifyList();
			});
		}
		const yearInput = document.getElementById('cal-year-input');
		if (yearInput) {
			yearInput.addEventListener('change', () => {
				const year = parseInt(yearInput.value);
				// ตรวจสอบว่าเป็นปีที่สมเหตุสมผลหรือไม่ (เช่น 1900-2100)
				if (year > 1900 && year < 2100) {
					// กำหนดวันที่ให้ไปวันที่ 1 มกราคม ของปีนั้น
					state.calendarCurrentDate = `${year}-01-01`;
					renderCalendarView(); // สั่งให้วาดปฏิทินใหม่ (ซึ่งจะไปดึงวันหยุดใหม่ด้วย)
				}
			});
		}
		// --- สั่งให้สวิตช์ทำงานทันที ---
		const calSwitches = ['cal-toggle-holiday', 'cal-toggle-buddhist', 'cal-toggle-money'];
		calSwitches.forEach(id => {
			const el = document.getElementById(id);
			if (el) {
				el.addEventListener('change', () => {
					// รีโหลดปฏิทินทันทีที่กดสวิตช์
					renderCalendarView(); 
				});
			}
		});
		
		// --- [NEW] Advanced Filter Event Listeners ---
		const advStart = document.getElementById('adv-filter-start');
		const advEnd = document.getElementById('adv-filter-end');
		const advType = document.getElementById('adv-filter-type');
		const advSearch = document.getElementById('adv-filter-search');
		const btnClearSearch = document.getElementById('btn-clear-search');

		if (advStart && advEnd) {
			// ตั้งค่าเริ่มต้น: วันที่ 1 ของเดือน ถึง วันสุดท้ายของเดือน
			const now = new Date();
			const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
			const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0); // วันที่ 0 ของเดือนถัดไป = วันสุดท้ายเดือนนี้
			
			// แปลงเป็น string YYYY-MM-DD (ระวังเรื่อง timezone, ใช้แบบบ้านๆ ปลอดภัยสุด)
			const formatDate = (d) => {
				let month = '' + (d.getMonth() + 1), day = '' + d.getDate(), year = d.getFullYear();
				if (month.length < 2) month = '0' + month;
				if (day.length < 2) day = '0' + day;
				return [year, month, day].join('-');
			};

			advStart.value = formatDate(firstDay);
			advEnd.value = formatDate(lastDay);

			// เมื่อเปลี่ยนค่า ให้เรียก renderListPage() ทันที
			advStart.addEventListener('change', renderListPage);
			advEnd.addEventListener('change', renderListPage);
			advType.addEventListener('change', renderListPage);
			advSearch.addEventListener('input', renderListPage); // ค้นหาทันทีที่พิมพ์ (Real-time)
			
			// ปุ่มล้างคำค้นหา
			if (btnClearSearch) {
				btnClearSearch.addEventListener('click', () => {
					advSearch.value = '';
					renderListPage();
				});
			}
		}
		
		// เพิ่มใน setupEventListeners()
		const btnExport = document.getElementById('btn-export-filtered');
		if (btnExport) {
			btnExport.addEventListener('click', exportFilteredList);
		}
		
		// [NEW] ตัวจัดการคลิกปุ่มเปลี่ยนกราฟ (Category / Time)
		const btnChartCat = document.getElementById('btn-chart-category');
		const btnChartTime = document.getElementById('btn-chart-time');

		if (btnChartCat && btnChartTime) {
			btnChartCat.addEventListener('click', () => {
				switchChartMode('category');
			});
			
			btnChartTime.addEventListener('click', () => {
				switchChartMode('time');
			});
		}
	
    }


// ========================================
// EVENT HANDLER FUNCTIONS
// ========================================
    function handleChangeViewMode(e, source) {
        const newMode = e.target.value;
        if (source === 'home') {
            state.homeViewMode = newMode;
            state.homeCurrentPage = 1;
            renderAll(); 
        } else {
            state.listViewMode = newMode;
            state.listCurrentPage = 1;
            renderListPage();
        }
        updateSharedControls(source);
    }

    function handleDateChange(e, source) {
        const changedElement = e.target;
        let newDate;
        let viewMode = (source === 'home') ? state.homeViewMode : state.listViewMode;
        if (viewMode === 'month') {
            const [year, month] = changedElement.value.split('-');
            if (year && month) {
                newDate = `${year}-${month}-01`;
            }
        } else {
            const year = changedElement.value;
            if (year && year.length === 4) {
                newDate = `${year}-01-01`;
            }
        }

        if (newDate) {
            if (source === 'home') {
                state.homeCurrentDate = newDate;
                state.homeCurrentPage = 1;
                renderAll();
            } else {
                state.listCurrentDate = newDate;
                state.listCurrentPage = 1;
                renderListPage();
            }
        }
    }
    
    function navigateMonth(direction, source) {
        let dateStr = (source === 'home') ? state.homeCurrentDate : state.listCurrentDate;
        let date = new Date(dateStr);
        date.setMonth(date.getMonth() + direction);
        const newDate = date.toISOString().slice(0, 10);
        if (source === 'home') {
            state.homeCurrentDate = newDate;
            state.homeCurrentPage = 1;
            renderAll();
            updateSharedControls('home');
        } else {
            state.listCurrentDate = newDate;
            state.listCurrentPage = 1;
            renderListPage();
            updateSharedControls('list');
        }
    }

    function navigateYear(direction, source) {
        let dateStr = (source === 'home') ? state.homeCurrentDate : state.listCurrentDate;
        let date = new Date(dateStr);
        date.setFullYear(date.getFullYear() + direction);
        const newDate = date.toISOString().slice(0, 10);
        if (source === 'home') {
            state.homeCurrentDate = newDate;
            state.homeCurrentPage = 1;
            renderAll();
            updateSharedControls('home');
        } else {
            state.listCurrentDate = newDate;
            state.listCurrentPage = 1;
            renderListPage();
            updateSharedControls('list');
        }
    }

    function handleSearch(e) {
        state.searchTerm = e.target.value;
        state.listCurrentPage = 1;
        renderListPage();
    }

    function handleFilter(buttonEl) {
        document.querySelectorAll('#list-filter-buttons .filter-btn').forEach(btn => {
            btn.classList.remove('bg-purple-500', 'text-white');
            btn.classList.add('bg-gray-200', 'text-gray-700');
        });
        buttonEl.classList.add('bg-purple-500', 'text-white');
        buttonEl.classList.remove('bg-gray-200', 'text-gray-700');
        
        state.filterType = buttonEl.dataset.filter;
        state.listCurrentPage = 1;
        renderListPage();
    }

    function handleHomeFilter(buttonEl) {
        document.querySelectorAll('#home-filter-buttons .home-filter-btn').forEach(btn => {
            btn.classList.remove('bg-purple-500', 'text-white');
            btn.classList.add('bg-gray-200', 'text-gray-700');
        });
        buttonEl.classList.add('bg-purple-500', 'text-white');
        buttonEl.classList.remove('bg-gray-200', 'text-gray-700');
        
        state.homeFilterType = buttonEl.dataset.filter;
        
        state.homeCurrentPage = 1;
        renderAll();
    }

    async function handleEditClick(buttonEl) {
        const txId = buttonEl.dataset.id;
        const hasPermission = await promptForPassword('ป้อนรหัสผ่านเพื่อแก้ไข');
        if (hasPermission) {
            openModal(txId);
        }
    }

    async function handleDeleteClick(buttonEl) {
        const txId = buttonEl.dataset.id;
        const hasPermission = await promptForPassword('ป้อนรหัสผ่านเพื่อลบ');
        if (!hasPermission) {
            return;
        }
        
        Swal.fire({
            title: 'แน่ใจหรือไม่?',
            text: "คุณต้องการลบรายการนี้ใช่หรือไม่",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#aaa',
            confirmButtonText: 'ใช่, ลบเลย!',
            cancelButtonText: 'ยกเลิก'
        }).then(async (result) => {
            if (result.isConfirmed) {
                const oldTx = state.transactions.find(tx => tx.id === txId);
				// +++ เพิ่มบรรทัดนี้ครับ (ส่งแจ้งเตือนก่อนลบ) +++
                if (oldTx) {
                    sendLineAlert(oldTx, 'delete');
                }
                // +++++++++++++++++++++++++++++++++++++++
                try {
                    await dbDelete(STORE_TRANSACTIONS, txId);
                    state.transactions = state.transactions.filter(tx => tx.id !== txId);
                    setLastUndoAction({ type: 'tx-delete', data: JSON.parse(JSON.stringify(oldTx)) });
                    if (currentPage === 'home') renderAll();
                    if (currentPage === 'list') renderListPage();
                    if (currentPage === 'calendar') renderCalendarView(); 

                    // +++ Update Account Detail Modal if open +++
                    await refreshAccountDetailModalIfOpen();
					
					renderBudgetWidget();

                    // --- โค้ดใหม่: ใช้ตรรกะเดียวกับตอนบันทึก ---
					const isLogged = window.auth && window.auth.currentUser;

					Swal.fire({
						title: 'ลบแล้ว!',
						text: 'รายการของคุณถูกลบแล้ว',
						icon: 'success',
						timer: isLogged ? 1000 : undefined,
						showConfirmButton: !isLogged
					});
                } catch (err) {
                    console.error("Failed to delete transaction:", err);
                    Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบข้อมูลได้', 'error');
                }
            }
        });
    }

    function handlePaginationClick(e, source) {
        const btn = e.target.closest('button');
        if (!btn || btn.disabled) return;

        const page = parseInt(btn.dataset.page, 10);
        if (isNaN(page)) return;
        if (source === 'home') {
            state.homeCurrentPage = page;
            renderAll();
        } else {
            state.listCurrentPage = page;
            renderListPage();
        }
    }

    async function handleAddAccount(e) {
        e.preventDefault();
        const getEl = (id) => document.getElementById(id);
        document.getElementById('account-calculator-popover').classList.add('hidden'); 

        const name = getEl('input-account-name').value.trim();
        const type = getEl('select-account-type').value;
        
        const rawBalance = getEl('input-account-balance').value;
        let initialBalance = safeCalculate(rawBalance);
        if (initialBalance === null) {
             Swal.fire('ข้อมูลไม่ถูกต้อง', 'ยอดเริ่มต้นไม่ถูกต้อง', 'warning');
            return;
        }
        initialBalance = parseFloat(initialBalance.toFixed(2));
        if (!name) {
            Swal.fire('ข้อผิดพลาด', 'กรุณาใส่ชื่อบัญชี', 'warning');
            return;
        }
        
        const defaultIconName = type === 'credit' ? 'fa-credit-card' : (type === 'liability' ? 'fa-file-invoice-dollar' : 'fa-wallet');

        const newAccount = {
            id: `acc-${Date.now()}`,
            name: name,
            type: type,
            initialBalance: initialBalance,
            icon: defaultIconName,
            iconName: defaultIconName, 
            displayOrder: Date.now() 
        };
        try {
            await dbPut(STORE_ACCOUNTS, newAccount);
            state.accounts.push(newAccount);
            setLastUndoAction({ type: 'account-add', data: newAccount }); 
            renderAccountSettingsList();
            if (currentPage === 'home') renderAll(); 
            getEl('form-add-account').reset();
            getEl('input-account-balance').value = 0;
            getEl('acc-calc-preview').textContent = '';
            Swal.fire('เพิ่มสำเร็จ', `บัญชี <b class="text-purple-600">${escapeHTML(name)}</b> ถูกเพิ่มเรียบร้อยแล้ว`, 'success');

        } catch (err) {
            console.error("Failed to add account:", err);
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเพิ่มบัญชีได้', 'error');
        }
    }

    async function handleEditAccountSubmit(e) {
        const getEl = (id) => document.getElementById(id);
        document.getElementById('edit-account-calculator-popover').classList.add('hidden'); 

        const accountId = getEl('edit-account-id').value;
        const name = getEl('edit-account-name').value.trim();
        const type = getEl('edit-account-type').value;
        
        const rawBalance = getEl('edit-account-balance').value;
        let initialBalance = safeCalculate(rawBalance);
        
        if (initialBalance === null) {
             Swal.fire('ข้อมูลไม่ถูกต้อง', 'ยอดเริ่มต้นไม่ถูกต้อง', 'warning');
             return;
        }
        initialBalance = parseFloat(initialBalance.toFixed(2));

        if (!name || !accountId) {
            Swal.fire('ข้อผิดพลาด', 'ข้อมูลไม่ถูกต้อง', 'error');
            return;
        }
        
        const accountIndex = state.accounts.findIndex(a => a.id === accountId);
        if (accountIndex === -1) {
            Swal.fire('ข้อผิดพลาด', 'ไม่พบบัญชี', 'error');
            return;
        }
        
        const oldAccount = JSON.parse(JSON.stringify(state.accounts[accountIndex])); 
        
        const defaultIconName = type === 'credit' ? 'fa-credit-card' : (type === 'liability' ? 'fa-file-invoice-dollar' : 'fa-wallet');

        const updatedAccount = {
            ...state.accounts[accountIndex], 
            name: name,
            type: type,
            initialBalance: initialBalance,
            icon: defaultIconName, 
            iconName: state.accounts[accountIndex].iconName || defaultIconName 
        };

        try {
            await dbPut(STORE_ACCOUNTS, updatedAccount);
            state.accounts[accountIndex] = updatedAccount;
            setLastUndoAction({ type: 'account-edit', oldData: oldAccount, newData: updatedAccount }); 
			
			// [NEW] ตรวจสอบและบันทึกรายการปรับปรุงยอด (ถ้ามีการกรอกมา)
            const adjAmountVal = getEl('adjust-tx-amount').value;
            const adjType = getEl('adjust-tx-type').value;
            const adjDesc = getEl('adjust-tx-desc').value.trim();
            
            let adjMessage = ''; // เอาไว้เก็บข้อความแจ้งเตือนเพิ่ม

            if (adjAmountVal && parseFloat(adjAmountVal) > 0) {
                const amount = parseFloat(adjAmountVal);
                // สร้าง Transaction ใหม่
                const newTx = {
                    id: `tx-adj-${Date.now()}`,
                    type: adjType, // 'income' หรือ 'expense'
                    amount: amount,
                    name: adjDesc || (adjType === 'income' ? 'ดอกเบี้ยรับ/ปรับยอดเพิ่ม' : 'ค่าธรรมเนียม/ปรับยอดลด'),
                    category: 'ปรับปรุงยอดบัญชี', 
                    accountId: accountId,
                    date: new Date().toISOString(), // ใช้วันเวลาปัจจุบัน
                    desc: 'ปรับปรุงยอดผ่านเมนูแก้ไขบัญชี'
                };
                
                await dbPut(STORE_TRANSACTIONS, newTx);
                state.transactions.push(newTx);
                
                // แจ้งเตือน Line (ถ้ามีฟังก์ชันนี้)
                if (typeof sendLineAlert === 'function') {
                    sendLineAlert(newTx, 'add');
                }
                
                adjMessage = `<br><span class="text-sm text-gray-500">และบันทึกรายการปรับปรุงยอด ${formatCurrency(amount)} เรียบร้อย</span>`;
            }
			
            renderAccountSettingsList();
            if (currentPage === 'home') renderAll(); 
            openAccountModal(null, true); 
            Swal.fire({
                title: 'สำเร็จ',
                html: `อัปเดตข้อมูลบัญชีเรียบร้อยแล้ว${adjMessage}`,
                icon: 'success'
            });
        } catch (err) {
             console.error("Failed to edit account:", err);
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถอัปเดตบัญชีได้', 'error');
        }
    }
    
    async function handleMoveAccount(accountId, direction) {
        const sortedAccounts = getSortedAccounts();
        const currentIndex = sortedAccounts.findIndex(a => a.id === accountId);

        if (currentIndex === -1) return; 

        let targetIndex;
        if (direction === 'up' && currentIndex > 0) {
            targetIndex = currentIndex - 1;
        } else if (direction === 'down' && currentIndex < sortedAccounts.length - 1) {
            targetIndex = currentIndex + 1;
        } else {
            return; 
        }

        const currentAccount = sortedAccounts[currentIndex];
        const targetAccount = sortedAccounts[targetIndex];

        const oldCurrentOrder = currentAccount.displayOrder;
        const oldTargetOrder = targetAccount.displayOrder;

        const tempOrder = currentAccount.displayOrder;
        currentAccount.displayOrder = targetAccount.displayOrder;
        targetAccount.displayOrder = tempOrder;
        
        const actionData = {
            type: 'account-move',
            currentAccountId: currentAccount.id,
            newCurrentOrder: currentAccount.displayOrder, 
            oldCurrentOrder: oldCurrentOrder,
            targetAccountId: targetAccount.id,
            newTargetOrder: targetAccount.displayOrder, 
            oldTargetOrder: oldTargetOrder
        };

        try {
            await Promise.all([
                dbPut(STORE_ACCOUNTS, currentAccount),
                dbPut(STORE_ACCOUNTS, targetAccount)
            ]);
            
            setLastUndoAction(actionData); 
            
            state.accounts = state.accounts.map(acc => {
                if (acc.id === currentAccount.id) return currentAccount;
                if (acc.id === targetAccount.id) return targetAccount;
                return acc;
            });
            
            renderAccountSettingsList();
            
            if (currentPage === 'home') {
                const allAccountBalances = getAccountBalances(state.transactions);
                renderAllAccountSummary(allAccountBalances);
            }
            
        } catch (err) {
            console.error("Failed to move account:", err);
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถสลับลำดับบัญชีได้', 'error');
            currentAccount.displayOrder = oldCurrentOrder;
            targetAccount.displayOrder = oldTargetOrder;
        }
    }

    async function handleDeleteAccountClick(buttonEl) {
        const accountId = buttonEl.dataset.id;
        const acc = state.accounts.find(a => a.id === accountId);
        if (!acc) return;

        const txInUse = state.transactions.find(tx => tx.accountId === accountId || tx.toAccountId === accountId);
        if (txInUse) {
            Swal.fire('ลบไม่ได้', 'ไม่สามารถลบบัญชีนี้ได้เนื่องจากมีธุรกรรมที่เกี่ยวข้อง (เช่น รายรับ/รายจ่าย หรือการโอนย้าย)', 'error');
            return;
        }
        
        Swal.fire({
            title: 'ยืนยันการลบ?',
            html: `คุณต้องการลบบัญชี: <b class="text-purple-600">${escapeHTML(acc.name)}</b> ใช่หรือไม่?<br><small>(จะลบได้ก็ต่อเมื่อไม่มีธุรกรรมใดๆ อ้างอิงถึง)</small>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#aaa',
            confirmButtonText: 'ใช่, ลบเลย!',
            cancelButtonText: 'ยกเลิก'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const oldAccount = JSON.parse(JSON.stringify(acc)); 
                    await dbDelete(STORE_ACCOUNTS, accountId);
                    state.accounts = state.accounts.filter(a => a.id !== accountId);
                    setLastUndoAction({ type: 'account-delete', data: oldAccount }); 
                    renderAccountSettingsList();
                    if (currentPage === 'home') renderAll();
                    Swal.fire('ลบแล้ว!', 'บัญชีถูกลบแล้ว', 'success');
                } catch (err) {
                    console.error("Failed to delete account:", err);
                    Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบข้อมูลได้', 'error');
                }
            }
        });
    }


    async function handleAddCategory(e) {
        e.preventDefault();
        const formId = e.target.id;
        const type = (formId === 'form-add-income-cat') ? 'income' : 'expense';
        const input = document.getElementById(`input-${type}-cat`);
        const name = input.value.trim();

        if (name && !state.categories[type].includes(name)) {
            state.categories[type].push(name);
            try {
                await dbPut(STORE_CATEGORIES, { type: type, items: state.categories[type] });
                setLastUndoAction({ type: 'cat-add', catType: type, name: name });
                renderSettings();
                input.value = '';
            } catch (err) {
                console.error("Failed to add category:", err);
                Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกหมวดหมู่ได้', 'error');
                state.categories[type] = state.categories[type].filter(cat => cat !== name);
            }
        } else if (!name) {
            Swal.fire('ข้อผิดพลาด', 'กรุณาใส่ชื่อหมวดหมู่', 'warning');
        } else {
            Swal.fire('ข้อผิดพลาด', 'มีหมวดหมู่นี้อยู่แล้ว', 'error');
        }
    }

    // [แก้ไข] เพิ่มการถามรหัสผ่านก่อนลบหมวดหมู่
    async function handleDeleteCategory(buttonEl) {
        const type = buttonEl.dataset.type;
        const name = buttonEl.dataset.name;

        // +++ เพิ่มส่วนนี้ +++
        const hasPermission = await promptForPassword('ป้อนรหัสผ่านเพื่อลบหมวดหมู่');
        if (!hasPermission) return;
        // ++++++++++++++++++

        Swal.fire({
            title: 'ยืนยันการลบ?',
            html: `คุณต้องการลบหมวดหมู่: <b class="text-purple-600">${escapeHTML(name)}</b> ใช่หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
             confirmButtonColor: '#d33',
            cancelButtonColor: '#aaa',
            confirmButtonText: 'ใช่, ลบเลย!',
            cancelButtonText: 'ยกเลิก'
        }).then(async (result) => {
            // ... (โค้ดเดิมด้านในเหมือนเดิม)
             if (result.isConfirmed) {
                const oldCategories = [...state.categories[type]];
                state.categories[type] = state.categories[type].filter(cat => cat !== name);
                try {
                     await dbPut(STORE_CATEGORIES, { type: type, items: state.categories[type] });
                    setLastUndoAction({ type: 'cat-delete', catType: type, name: name });
                    renderSettings();
                    Swal.fire('ลบแล้ว!', 'หมวดหมู่ถูกลบแล้ว', 'success');
                } catch (err) {
                    console.error("Failed to delete category:", err);
                    Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบหมวดหมู่ได้', 'error');
                    state.categories[type] = oldCategories;
                }
            }
        });
    }

    async function handleAddFrequentItem(e) {
        e.preventDefault();
        const input = document.getElementById('input-frequent-item');
        const name = input.value.trim();

        if (name && !state.frequentItems.includes(name)) {
            try {
                await dbPut(STORE_FREQUENT_ITEMS, { name: name });
                state.frequentItems.push(name);
                setLastUndoAction({ type: 'item-add', name: name });
                renderSettings();
                input.value = '';
            } catch (err) {
                console.error("Failed to add frequent item:", err);
                Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกรายการได้', 'error');
            }
        } else if (!name) {
            Swal.fire('ข้อผิดพลาด', 'กรุณาใส่ชื่อรายการ', 'warning');
        } else {
            Swal.fire('ข้อผิดพลาด', 'มีรายการนี้อยู่แล้ว', 'error');
        }
    }

    // [แก้ไข] เพิ่มการถามรหัสผ่านก่อนลบรายการที่ใช้บ่อย
    async function handleDeleteFrequentItem(buttonEl) {
        const name = buttonEl.dataset.name;
        
        // +++ เพิ่มส่วนนี้ +++
        const hasPermission = await promptForPassword('ป้อนรหัสผ่านเพื่อลบรายการ');
        if (!hasPermission) return;
        // ++++++++++++++++++

        Swal.fire({
            title: 'ยืนยันการลบ?',
            html: `คุณต้องการลบรายการที่ใช้บ่อย: <b class="text-purple-600">${escapeHTML(name)}</b> ใช่หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
             confirmButtonColor: '#d33',
            cancelButtonColor: '#aaa',
            confirmButtonText: 'ใช่, ลบเลย!',
            cancelButtonText: 'ยกเลิก'
        }).then(async (result) => {
            // ... (โค้ดเดิมด้านในเหมือนเดิม)
             if (result.isConfirmed) {
                try {
                    await dbDelete(STORE_FREQUENT_ITEMS, name);
                    state.frequentItems = state.frequentItems.filter(item => 
                    item !== name);
                    setLastUndoAction({ type: 'item-delete', name: name });
                    renderSettings();
                    Swal.fire('ลบแล้ว!', 'รายการที่ใช้บ่อยถูกลบแล้ว', 'success');

                 } catch (err) {
                    console.error("Failed to delete frequent item:", err);
                    Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบรายการได้', 'error');
                }
            }
        });
    }
    
    async function handleToggleFavorite() {
        const nameInput = document.getElementById('tx-name');
        const toggleFavBtn = document.getElementById('toggle-favorite-btn');
        const name = nameInput.value.trim();

        if (!name) {
            Swal.fire('ข้อผิดพลาด', 'กรุณาใส่ชื่อรายการก่อนกำหนดเป็นรายการโปรด', 'warning');
            return;
        }

        const isCurrentlyFav = toggleFavBtn.classList.contains('text-yellow-500');

        if (isCurrentlyFav) {
            try {
                await dbDelete(STORE_FREQUENT_ITEMS, name);
                state.frequentItems = state.frequentItems.filter(item => item !== name);
                
                toggleFavBtn.classList.remove('text-yellow-500');
                toggleFavBtn.classList.add('text-gray-400');
                
                renderSettings(); 
                showToast("ลบออกจากรายการโปรดแล้ว", "success");
            } catch (err) {
                Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบรายการโปรดได้', 'error');
            }
        } else {
            if (state.frequentItems.includes(name)) return; 

            try {
                await dbPut(STORE_FREQUENT_ITEMS, { name: name });
                state.frequentItems.push(name);
                
                toggleFavBtn.classList.add('text-yellow-500');
                toggleFavBtn.classList.remove('text-gray-400');

                renderSettings(); 
                showToast("เพิ่มเป็นรายการโปรดแล้ว", "success");
            } catch (err) {
                Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเพิ่มรายการโปรดได้', 'error');
            }
        }
    }

    async function handleManagePassword() {
        if (state.password) {
            const hasPermission = await promptForPassword('ป้อนรหัสผ่านปัจจุบัน');
            if (!hasPermission) return;

            const { value: action } = await Swal.fire({
                title: 'จัดการรหัสผ่าน',
                text: 'คุณต้องการทำอะไร?',
                icon: 'info',
       
                 showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: 'เปลี่ยนรหัสผ่าน',
                denyButtonText: 'ลบรหัสผ่าน',
       
                 cancelButtonText: 'ยกเลิก'
            });
            if (action === true) {
                const { value: newPassword } = await Swal.fire({
                    title: 'ตั้งรหัสผ่านใหม่',
                    input: 'password',

                     inputPlaceholder: 'กรอกรหัสผ่านใหม่',
                    showCancelButton: true,
                    inputValidator: (value) => {
          
                         if (!value) return 'รหัสผ่านห้ามว่าง!';
                    }
                });
                if (newPassword) {
                    const { value: confirmPassword } = await Swal.fire({
                        title: 'ยืนยันรหัสผ่านใหม่',
                      
                         input: 'password',
                        inputPlaceholder: 'กรอกรหัสผ่านใหม่อีกครั้ง',
                        showCancelButton: true,
                       
                         inputValidator: (value) => {
                            if (value !== newPassword) return 'รหัสผ่านไม่ตรงกัน!';
                        }
               
                 });

                    if (confirmPassword === newPassword) {
                        const hashedNewPassword = CryptoJS.SHA256(newPassword).toString();
                        await dbPut(STORE_CONFIG, { key: 'password', value: hashedNewPassword });
                        state.password = hashedNewPassword;
                        Swal.fire('สำเร็จ!', 'เปลี่ยนรหัสผ่านเรียบร้อย', 'success');
                        resetAutoLockTimer(); 
                    }
                }

            } else if (action === false) {
                Swal.fire({
                  
                     title: 'ยืนยันลบรหัสผ่าน?',
                    text: 'คุณจะไม่ต้องใช้รหัสผ่านในการแก้ไข/ลบ อีกต่อไป',
                    icon: 'warning',
                    showCancelButton: true,
 
                     confirmButtonColor: '#d33',
                    confirmButtonText: 'ใช่, ลบรหัสผ่าน',
                    cancelButtonText: 'ยกเลิก'
             
             }).then(async (result) => {
                    if (result.isConfirmed) {
                        await dbPut(STORE_CONFIG, { key: 'password', value: null });
                 
                 state.password = null;
                        Swal.fire('สำเร็จ!', 'ลบรหัสผ่านเรียบร้อย', 'success');
                        resetAutoLockTimer(); 
                    }
                });
            }

        } else {
            const { value: newPassword } = await Swal.fire({
                title: 'ตั้งรหัสผ่านใหม่',
                text: 'ตั้งรหัสผ่านสำหรับการแก้ไขและลบรายการ',

                 input: 'password',
                inputPlaceholder: 'กรอกรหัสผ่านที่ต้องการ',
                showCancelButton: true,
                inputValidator: (value) => {

                     if (!value) return 'รหัสผ่านห้ามว่าง!';
                }
            });
            if (newPassword) {
                const { value: confirmPassword } = await Swal.fire({
                    title: 'ยืนยันรหัสผ่านใหม่',
                    input: 'password',
 
                     inputPlaceholder: 'กรอกรหัสผ่านใหม่อีกครั้ง',
                    showCancelButton: true,
                    inputValidator: (value) => {
            
                     if (value !== newPassword) return 'รหัสผ่านไม่ตรงกัน!';
                    }
                });
                if (confirmPassword === newPassword) {
                    const hashedNewPassword = CryptoJS.SHA256(newPassword).toString();
                    await dbPut(STORE_CONFIG, { key: 'password', value: hashedNewPassword });
                    state.password = hashedNewPassword;
                    Swal.fire('สำเร็จ!', 'ตั้งค่ารหัสผ่านเรียบร้อย', 'success');
                    resetAutoLockTimer(); 
                }
            }
        }
    }

		// ============================================
		// รวมศูนย์สำรองข้อมูล (Backup Center) - 3 Options
		// ============================================
		async function handleBackup() {
			// 1. ตรวจสอบรหัสผ่าน / สแกนนิ้ว ก่อนเข้าเมนู
			const hasPermission = await promptForPassword('ป้อนรหัสผ่านเพื่อจัดการสำรองข้อมูล');
			if (!hasPermission) return;

			// ตัวแปรเก็บค่าที่เลือก
			let selectedChoice = null;

			// 2. แสดงเมนูเลือก 3 แบบ (แก้ไขปุ่มที่ 2)
			const { value: choice } = await Swal.fire({
				title: 'เลือกวิธีการสำรองข้อมูล',
				html: `
					<div class="flex flex-col gap-3 mt-4">
						<button id="btn-opt-json" class="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 px-4 rounded-xl text-lg font-medium shadow-md transition-all flex items-center justify-center">
							<i class="fa-solid fa-file-code mr-3"></i> สำรองไฟล์ลงเครื่อง (.json)
						</button>

						<button id="btn-opt-xlsx" class="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl text-lg font-medium shadow-md transition-all flex items-center justify-center">
							<i class="fa-solid fa-file-excel mr-3"></i> ส่งออกเป็น Excel (.xlsx)
						</button>

						<button id="btn-opt-cloud" class="w-full bg-sky-500 hover:bg-sky-600 text-white py-3 px-4 rounded-xl text-lg font-medium shadow-md transition-all flex items-center justify-center">
							<i class="fa-solid fa-cloud-arrow-up mr-3"></i> สำรองข้อมูลขึ้น Cloud
						</button>
					</div>
				`,
				showConfirmButton: false,
				showCancelButton: true,
				cancelButtonText: 'ปิดเมนู',
				cancelButtonColor: '#9ca3af',
				didOpen: () => {
					// ผูกปุ่มกด
					document.getElementById('btn-opt-json').onclick = () => {
						selectedChoice = 'json'; Swal.clickConfirm();
					};
					// แก้ไข ID และ Value
					document.getElementById('btn-opt-xlsx').onclick = () => {
						selectedChoice = 'xlsx'; Swal.clickConfirm();
					};
					document.getElementById('btn-opt-cloud').onclick = () => {
						selectedChoice = 'cloud'; Swal.clickConfirm();
					};
				}
			});

			if (!selectedChoice) return;

			// 3. แยกทำงานตามฟังก์ชัน
			if (selectedChoice === 'json') {
				await executeJsonBackup();
			} else if (selectedChoice === 'xlsx') {
				await executeExcelExport(); // เรียกฟังก์ชันใหม่
			} else if (selectedChoice === 'cloud') {
				await executeCloudSync();
			}
		}

		// --- Logic 1: JSON Backup (ย้ายมาจาก handleBackup เดิม) ---
		async function executeJsonBackup() {
			const currentVersion = (typeof APP_VERSION !== 'undefined') ? APP_VERSION : 'v7.5';

			const isConfirmed = await Swal.fire({
				title: 'ยืนยันการสำรองข้อมูล?',
				text: `คุณต้องการสำรองข้อมูล (.json) เวอร์ชัน ${currentVersion} ใช่หรือไม่?`,
				icon: 'info',
				showCancelButton: true,
				confirmButtonColor: '#6366f1',
				cancelButtonColor: '#aaa',
				confirmButtonText: 'ใช่, ดาวน์โหลดไฟล์',
				cancelButtonText: 'ยกเลิก'
			}).then(result => result.isConfirmed);

			if (isConfirmed) {
				try {
					Swal.fire({ title: 'กำลังสร้างไฟล์...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

					// รวบรวมข้อมูล
					const hasRecurring = db.objectStoreNames.contains(STORE_RECURRING);
					const recurringData = hasRecurring ? await dbGetAll(STORE_RECURRING) : [];
					const autoConfirmKey = (typeof AUTO_CONFIRM_CONFIG_KEY !== 'undefined') ? AUTO_CONFIRM_CONFIG_KEY : 'autoConfirmPassword';

					const backupState = {
						accounts: await dbGetAll(STORE_ACCOUNTS), 
						transactions: await dbGetAll(STORE_TRANSACTIONS),
						categories: {
							income: (await dbGet(STORE_CATEGORIES, 'income'))?.items || [],
							expense: (await dbGet(STORE_CATEGORIES, 'expense'))?.items || []
						},
						frequentItems: (await dbGetAll(STORE_FREQUENT_ITEMS)).map(item => item.name),
						autoCompleteList: await dbGetAll(STORE_AUTO_COMPLETE),
						recurringRules: recurringData, 
						budgets: await dbGetAll(STORE_BUDGETS),
						password: (await dbGet(STORE_CONFIG, 'password'))?.value || null,
						autoLockTimeout: (await dbGet(STORE_CONFIG, AUTOLOCK_CONFIG_KEY))?.value || 0, 
						isDarkMode: (await dbGet(STORE_CONFIG, DARK_MODE_CONFIG_KEY))?.value || false,
						autoConfirmPassword: (await dbGet(STORE_CONFIG, autoConfirmKey))?.value || false
					};
					
					// สร้าง Blob
					const dataStr = JSON.stringify(backupState);
					const blob = new Blob([dataStr], { type: 'application/json' });
					const url = URL.createObjectURL(blob);
					
					// ตั้งชื่อไฟล์
					const now = new Date();
					const dateStr = now.toISOString().slice(0,10);
					const timeStr = now.toTimeString().slice(0,5).replace(':','');
					let filenamePrefix = `backup_${currentVersion}`;
					if (window.auth && window.auth.currentUser && window.auth.currentUser.email) {
						filenamePrefix = `${window.auth.currentUser.email}_${currentVersion}`; 
					}
					const exportFileDefaultName = `${filenamePrefix}_${dateStr}_${timeStr}.json`;
					
					// ดาวน์โหลด
					const linkElement = document.createElement('a');
					linkElement.setAttribute('href', url);
					linkElement.setAttribute('download', exportFileDefaultName);
					document.body.appendChild(linkElement);
					linkElement.click();
					document.body.removeChild(linkElement);
					setTimeout(() => URL.revokeObjectURL(url), 100);
					
					Swal.fire('สำเร็จ', `ดาวน์โหลดไฟล์เรียบร้อย`, 'success');
				} catch (err) {
					Swal.fire('ผิดพลาด', err.message, 'error');
				}
			}
		}

		// --- Logic 2: Excel (.xlsx) Export (สวยงาม + มีหน้าสรุป) ---
		async function executeExcelExport() {
			// ตรวจสอบ Library
			if (typeof XLSX === 'undefined') {
				Swal.fire('Error', 'ไม่พบ Library สำหรับสร้าง Excel (กรุณาตรวจสอบ index.html)', 'error');
				return;
			}

			const isConfirmed = await Swal.fire({
				title: 'ส่งออกเป็น Excel (.xlsx)?',
				text: `ระบบจะสร้างไฟล์ Excel ที่มีทั้ง "หน้าสรุปยอดบัญชี" และ "รายการเดินบัญชีทั้งหมด"`,
				icon: 'info',
				showCancelButton: true,
				confirmButtonColor: '#16a34a',
				cancelButtonColor: '#aaa',
				confirmButtonText: 'ใช่, ส่งออก',
				cancelButtonText: 'ยกเลิก'
			}).then(result => result.isConfirmed);

			if (!isConfirmed) return;

			try {
				Swal.fire({ title: 'กำลังสร้างไฟล์...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

				// หน่วงเวลาเล็กน้อยเพื่อให้หน้าจอ Loading แสดงผลทัน
				setTimeout(() => {
					try {
						const wb = XLSX.utils.book_new();

						// ---------------------------------------------------------
						// ส่วนที่ 1: เตรียมข้อมูลสำหรับ Sheet "Summary" (สรุปภาพรวม)
						// ---------------------------------------------------------
						const accountStats = {};
						// เริ่มต้นค่าสถิติให้ทุกบัญชี
						state.accounts.forEach(acc => {
							accountStats[acc.id] = {
								name: acc.name,
								type: acc.type,
								initial: acc.initialBalance || 0,
								income: 0,
								expense: 0,
								transferIn: 0,
								transferOut: 0,
								balance: acc.initialBalance || 0
							};
						});

						// คำนวณยอดจากรายการธุรกรรมทั้งหมด
						state.transactions.forEach(tx => {
							if (accountStats[tx.accountId]) {
								if (tx.type === 'income') {
									accountStats[tx.accountId].income += tx.amount;
									accountStats[tx.accountId].balance += tx.amount;
								} else if (tx.type === 'expense') {
									accountStats[tx.accountId].expense += tx.amount;
									accountStats[tx.accountId].balance -= tx.amount;
								} else if (tx.type === 'transfer') {
									accountStats[tx.accountId].transferOut += tx.amount;
									accountStats[tx.accountId].balance -= tx.amount;
								}
							}
							// กรณีรับโอน (ขาเข้า)
							if (tx.toAccountId && accountStats[tx.toAccountId]) {
								accountStats[tx.toAccountId].transferIn += tx.amount;
								accountStats[tx.toAccountId].balance += tx.amount;
							}
						});

						// สร้าง Array ข้อมูลสำหรับ Sheet Summary
						const summaryData = [
							["รายงานสรุปภาพรวมบัญชี (Account Summary)"],
							["วันที่ออกรายงาน", new Date().toLocaleString('th-TH')],
							[], // เว้นบรรทัด
							["ชื่อบัญชี", "ประเภท", "ยอดยกมา", "รายรับรวม", "รายจ่ายรวม", "รับโอน", "โอนออก", "ยอดคงเหลือสุทธิ"]
						];

						let totalBalance = 0;
						
						// เรียงลำดับบัญชีตาม Display Order
						const sortedAccounts = [...state.accounts].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

						sortedAccounts.forEach(acc => {
							const stat = accountStats[acc.id];
							summaryData.push([
								stat.name,
								acc.type === 'credit' ? 'บัตรเครดิต' : (acc.type === 'liability' ? 'หนี้สิน' : 'เงินสด/เงินฝาก'),
								stat.initial,
								stat.income,
								stat.expense,
								stat.transferIn,
								stat.transferOut,
								stat.balance
							]);
							// คำนวณยอดรวม (เฉพาะบัญชีที่เป็นสินทรัพย์เพื่อความสมเหตุสมผล หรือรวมหมดก็ได้)
							if(acc.type !== 'liability') totalBalance += stat.balance;
							else totalBalance -= Math.abs(stat.balance); // ถ้าเป็นหนี้ให้นำมาลบ (แล้วแต่หลักการบัญชีของ user)
						});

						// สร้าง Sheet Summary
						const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
						
						// จัดความกว้างคอลัมน์ Summary
						wsSummary['!cols'] = [
							{wch: 25}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 20}
						];
						XLSX.utils.book_append_sheet(wb, wsSummary, "ภาพรวมบัญชี");


						// ---------------------------------------------------------
						// ส่วนที่ 2: เตรียมข้อมูลสำหรับ Sheet "Transactions" (รายการละเอียด)
						// ---------------------------------------------------------
						const accountsMap = new Map(state.accounts.map(a => [a.id, a.name]));
						const sortedTxs = [...state.transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

						const txData = sortedTxs.map(tx => {
							const d = new Date(tx.date);
							const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
							const timeStr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
							
							let signedAmount = tx.amount;
							if (tx.type === 'expense') signedAmount = -Math.abs(tx.amount);
							else if (tx.type === 'income') signedAmount = Math.abs(tx.amount);
							// transfer ปล่อยเป็นบวกในหน้านี้ เพื่อให้ดูง่ายว่ายอดเท่าไหร่

							return {
								"วันที่": dateStr,
								"เวลา": timeStr,
								"ประเภท": tx.type === 'income' ? 'รายรับ' : (tx.type === 'expense' ? 'รายจ่าย' : 'โอนย้าย'),
								"รายการ": tx.name,
								"หมวดหมู่": tx.category || '',
								"จำนวนเงิน": signedAmount,
								"บัญชีต้นทาง": accountsMap.get(tx.accountId) || 'N/A',
								"บัญชีปลายทาง": tx.toAccountId ? (accountsMap.get(tx.toAccountId) || '-') : '',
								"หมายเหตุ": tx.desc || '',
								"รูปใบเสร็จ": tx.receiptBase64 ? 'มี' : ''
							};
						});

						const wsTxs = XLSX.utils.json_to_sheet(txData);
						wsTxs['!cols'] = [
							{wch: 12}, {wch: 10}, {wch: 10}, {wch: 25}, {wch: 20}, 
							{wch: 15}, {wch: 20}, {wch: 20}, {wch: 30}, {wch: 8}
						];
						XLSX.utils.book_append_sheet(wb, wsTxs, "รายการเดินบัญชี");

						// ---------------------------------------------------------
						// ส่วนที่ 3: บันทึกไฟล์
						// ---------------------------------------------------------
						const now = new Date();
						const dateStr = now.toISOString().slice(0,10);
						const versionStr = (typeof APP_VERSION !== 'undefined') ? `_${APP_VERSION}` : '';
						
						let filename = `Statement_Summary${versionStr}_${dateStr}.xlsx`;
						if (window.auth && window.auth.currentUser && window.auth.currentUser.email) {
							filename = `${window.auth.currentUser.email}${versionStr}_Statement_${dateStr}.xlsx`;
						}

						XLSX.writeFile(wb, filename);

						// ปิด Loading และแสดง Success (กดตกลงเพื่อปิด)
						Swal.close();
						setTimeout(() => {
							Swal.fire({
								title: 'สำเร็จ',
								text: `ส่งออกไฟล์ ${filename} เรียบร้อย`,
								icon: 'success',
								confirmButtonText: 'ตกลง'
							});
						}, 500);

					} catch (innerErr) {
						console.error(innerErr);
						Swal.fire('ผิดพลาด', 'เกิดปัญหาระหว่างสร้างไฟล์ Excel', 'error');
					}
				}, 1000); // หน่วงเวลา 1 วินาที เพื่อความลื่นไหลของ UI

			} catch (err) {
				Swal.fire('ผิดพลาด', err.message, 'error');
				console.error(err);
			}
		}

		// --- Logic 3: Cloud Sync (ย้ายมาจาก handleForceSync เดิม) ---
		async function executeCloudSync() {
			const result = await Swal.fire({
				title: 'ยืนยันการส่งข้อมูลขึ้น Cloud?',
				text: "ข้อมูลในเครื่องนี้จะถูกส่งไปบันทึกทับ/รวมกับข้อมูลบน Cloud (เหมาะสำหรับ Manual Sync)",
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#0ea5e9',
				confirmButtonText: 'ใช่, อัปโหลดเดี๋ยวนี้',
				cancelButtonText: 'ยกเลิก'
			});

			if (result.isConfirmed) {
				// แจ้งเตือนแบบใหม่
                showToast("กำลังทยอยส่งข้อมูล... ห้ามปิดหน้าจอ", "info");

				try {
					const collections = [
						STORE_TRANSACTIONS, STORE_ACCOUNTS, STORE_CATEGORIES, 
						STORE_FREQUENT_ITEMS, STORE_CONFIG, STORE_AUTO_COMPLETE,
						STORE_RECURRING, STORE_BUDGETS
					];

					let totalCount = 0;
					for (const storeName of collections) {
						const items = await dbGetAll(storeName);
						if (items.length > 0) {
							await Promise.all(items.map(item => saveToCloud(storeName, item)));
							totalCount += items.length;
						}
					}
					Swal.fire('สำเร็จ!', `ส่งข้อมูล ${totalCount} รายการ ขึ้น Cloud เรียบร้อยแล้ว`, 'success');
				} catch (err) {
					Swal.fire('เกิดข้อผิดพลาด', err.message, 'error');
				}
			}
		}
    
    async function handleExportCSV() {
        const isConfirmed = await Swal.fire({
            title: 'ยืนยันการส่งออก?',
            text: `คุณต้องการส่งออกข้อมูลธุรกรรมเป็นไฟล์ CSV/Excel (${APP_VERSION}) ใช่หรือไม่?`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#aaa',
            confirmButtonText: 'ใช่, ส่งออก',
            cancelButtonText: 'ยกเลิก'
        }).then(result => result.isConfirmed);

        if (!isConfirmed) return;

        try {
            const transactions = state.transactions;
            const accountsMap = new Map(state.accounts.map(a => [a.id, a.name]));

            // --- ส่วนที่ 1: เตรียม Header และเนื้อหา CSV (เหมือนต้นฉบับ) ---
            const header = [
                "ID", "วันที่และเวลา", "ประเภท", "ชื่อรายการ", "หมวดหมู่", 
                "จำนวนเงิน", "บัญชีต้นทาง (From/Account)", "บัญชีปลายทาง (To)", "คำอธิบาย", "มีรูปใบเสร็จ"
            ];
            
            let csvContent = header.join(",") + "\n";

            const escapeCSVValue = (value) => {
                if (value === null || value === undefined) return "";
                let str = String(value);
                if (typeof value === 'number') str = value.toFixed(2); 
                str = str.replace(/,/g, ''); 
                return `"${str.replace(/"/g, '""')}"`; 
            };

            transactions.forEach(tx => {
                const dateObj = new Date(tx.date);
                const dateTime = dateObj.toISOString().slice(0, 19).replace('T', ' '); 
                
                const row = [
                    escapeCSVValue(tx.id),
                    escapeCSVValue(dateTime),
                    escapeCSVValue(tx.type),
                    escapeCSVValue(tx.name), 
                    escapeCSVValue(tx.category || ''),
                    escapeCSVValue(tx.amount), 
                    escapeCSVValue(accountsMap.get(tx.accountId) || 'N/A'),
                    escapeCSVValue(tx.toAccountId ? accountsMap.get(tx.toAccountId) || 'N/A' : ''),
                    escapeCSVValue(tx.desc || ''),
                    escapeCSVValue(!!tx.receiptBase64 ? 'Yes' : 'No') 
                ];
                
                csvContent += row.join(",") + "\n";
            });
            
            const finalContent = '\uFEFF' + csvContent; // เพิ่ม BOM ให้ Excel อ่านภาษาไทยออก
            const blob = new Blob([finalContent], { type: 'text/csv;charset=utf-8;' });

            // --- ส่วนที่ 2: ตั้งชื่อไฟล์ (แก้ไขใหม่: Email + Version) ---
            const now = new Date();
            const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
            
            let exportFileDefaultName;
            
            // ตรวจสอบว่ามีตัวแปร APP_VERSION หรือไม่ ถ้าไม่มีให้ใช้ค่าว่าง
            const versionStr = (typeof APP_VERSION !== 'undefined') ? `_${APP_VERSION}` : '';

            if (window.auth && window.auth.currentUser && window.auth.currentUser.email) {
                // กรณีล็อกอิน: email_v7.5_transactions_วันที่.csv
                exportFileDefaultName = `${window.auth.currentUser.email}${versionStr}_transactions_${dateStr}.csv`;
            } else {
                // กรณีไม่ล็อกอิน: transactions_v7.5_วันที่.csv
                exportFileDefaultName = `transactions${versionStr}_${dateStr}.csv`;
            }
            // -------------------------------------------------------
            
            if (navigator.msSaveBlob) { 
                navigator.msSaveBlob(blob, exportFileDefaultName);
            } else {
                const url = URL.createObjectURL(blob);
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', url);
                linkElement.setAttribute('download', exportFileDefaultName);
                
                linkElement.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
                
                URL.revokeObjectURL(url); 
            }
            
            Swal.fire('ส่งออกสำเร็จ', `ดาวน์โหลดไฟล์: ${exportFileDefaultName} เรียบร้อยแล้ว`, 'success');
            
        } catch (err) {
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถส่งออกไฟล์ CSV ได้', 'error');
            console.error("CSV Export failed: ", err);
        }
    }
    
    async function handleImport(e) {
        const file = e.target.files[0];
        const fileInput = document.getElementById('import-file-input'); 

        if (!file) {
            fileInput.value = null;
            return;
        }

        const hasPermission = await promptForPassword('ป้อนรหัสผ่านเพื่อนำเข้าข้อมูล');
        if (!hasPermission) {
            fileInput.value = null;
            return;
        }

        Swal.fire({
            title: 'ยืนยันการนำเข้าข้อมูล?',
            html: `คุณกำลังจะนำเข้าไฟล์: <b class="text-purple-600">${escapeHTML(file.name)}</b><br>การนำเข้าข้อมูลนี้จะเขียนทับ<br>รหัสผ่านและข้อมูลปัจจุบันของคุณทั้งหมด`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#22c55e',
            cancelButtonColor: '#aaa',
            confirmButtonText: 'ใช่, นำเข้า',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                const reader = new FileReader();
                reader.onload = async function(event) {
                    
                    try {
                        const importedState = JSON.parse(event.target.result);

                        let accountsToImport = importedState.accounts;
                        const isLegacyFile = !Array.isArray(importedState.accounts);
                        
                        if (isLegacyFile) {
                            console.warn("Import: Legacy file detected. Running migration...");
                            
                            const defaultCash = { 
                                id: 'acc-cash-' + Date.now(), 
                                name: 'เงินสดเริ่มต้น (Migrate)', 
                                type: 'cash', 
                                initialBalance: 0,
                                icon: 'fa-wallet',
                                iconName: 'fa-wallet', 
                                displayOrder: Date.now() 
                            };
                            const defaultCredit = { 
                                id: 'acc-credit-' + (Date.now() + 1), 
                                name: 'บัตรเครดิตเริ่มต้น (Migrate)', 
                                type: 'credit', 
                                initialBalance: 0,
                                icon: 'fa-credit-card',
                                iconName: 'fa-credit-card', 
                                displayOrder: Date.now() + 1 
                            };
                            accountsToImport = [defaultCash, defaultCredit];
                            
                            importedState.transactions.forEach(tx => {
                                if (tx.accountId) return; 
                                
                                if (tx.isNonDeductible === true) {
                                    tx.accountId = defaultCredit.id;
                                } else {
                                    tx.accountId = defaultCash.id;
                                }
                                
                                delete tx.isNonDeductible; 
                            });
                        }

                        if (!importedState || !importedState.categories || !importedState.transactions ||
                            !Array.isArray(importedState.frequentItems)) {
                            
                            if (importedState.transactions && !isLegacyFile) { 
                                Swal.fire('ไฟล์เก่า', 'ไฟล์นี้เป็นเวอร์ชันเก่า (v1) หรือรูปแบบไม่สมบูรณ์', 'error');
                                fileInput.value = null;
                                return;
                            }
                            throw new Error('Invalid file format');
                        }

                        await dbClear(STORE_ACCOUNTS);
                        for (const acc of accountsToImport) {
                            if (acc.iconName === undefined) {
                                acc.iconName = acc.icon || 'fa-wallet';
                            }
                            await dbPut(STORE_ACCOUNTS, acc);
                        }
                        
                        await dbClear(STORE_TRANSACTIONS);
                        for (const tx of importedState.transactions) {
                            if (tx.isNonDeductible !== undefined) { 
                                delete tx.isNonDeductible;
                            }
                            
                            if ((tx.type === 'income' || tx.type === 'expense') && !tx.accountId) {
                                 console.warn(`Skipping transaction ${tx.id} due to missing account ID.`);
                                 continue;
                            }

                            await dbPut(STORE_TRANSACTIONS, tx);
                        }
                        
                        await dbClear(STORE_CATEGORIES);
                        await dbPut(STORE_CATEGORIES, { type: 'income', items: importedState.categories.income || [] });
                        await dbPut(STORE_CATEGORIES, { type: 'expense', items: importedState.categories.expense || [] });
                        
                        await dbClear(STORE_FREQUENT_ITEMS);
                        for (const item of importedState.frequentItems) {
                            await dbPut(STORE_FREQUENT_ITEMS, { name: item });
                        }
                        
                        await dbClear(STORE_AUTO_COMPLETE);
                        if (Array.isArray(importedState.autoCompleteList)) {
                            for (const item of importedState.autoCompleteList) {
                                await dbPut(STORE_AUTO_COMPLETE, item);
                            }
                        }
						
						await dbClear(STORE_BUDGETS);
						if (Array.isArray(importedState.budgets)) {
							for (const budget of importedState.budgets) {
								await dbPut(STORE_BUDGETS, budget);
							}
						}
                        
                        await dbClear(STORE_CONFIG);
                        await dbPut(STORE_CONFIG, { key: 'password', value: importedState.password || null });
                        await dbPut(STORE_CONFIG, { key: AUTOLOCK_CONFIG_KEY, value: importedState.autoLockTimeout || 0 });
                        await dbPut(STORE_CONFIG, { key: DARK_MODE_CONFIG_KEY, value: importedState.isDarkMode || false }); 

                        fileInput.value = null;
                        Swal.fire({
                            title: 'นำเข้าข้อมูลสำเร็จ!',
                            text: 'ข้อมูลของคุณถูกนำเข้าเรียบร้อยแล้ว',
                            icon: 'success'
                        }).then(async () => {
                            await loadStateFromDB();
                            resetAutoLockTimer();
                            applyDarkModePreference();
                            renderSettings();
                            showPage('page-home'); 
                            // ปิด Modal ถ้าเปิดอยู่
                            document.getElementById('account-detail-modal').classList.add('hidden');
                        });
                    } catch (err) {
                        fileInput.value = null;
                        Swal.fire('เกิดข้อผิดพลาด', 'ไฟล์ข้อมูลไม่ถูกต้องหรือไม่สามารถอ่านได้', 'error');
                        console.error("Import failed: ", err);
                    }
                };
                reader.readAsText(file);
            } else {
                fileInput.value = null;
            }
        });
    }

    // ============================================
    // ฟังก์ชันล้างข้อมูล (แบบปุ่ม 3 สี) + บังคับ Logout
