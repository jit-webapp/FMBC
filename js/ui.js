// ไฟล์: js/ui.js
// จัดการหน้าจอ HTML และ DOM (User Interface)

// ========================================
// NOTIFICATION UI FUNCTIONS
// ========================================
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
	
	// ============================================
    // PWA INSTALL LOGIC (Android & iOS)
    // ============================================


// ========================================
// PWA INSTALL BUTTON
// ========================================
    function setupInstallButton() {
        const installContainer = document.getElementById('install-app-container');
        const installBtn = document.getElementById('btn-install-app');
        let deferredPrompt; // ตัวแปรเก็บ Event ของ Android/Chrome

        // 1. ตรวจสอบว่าเป็น iOS หรือไม่
        const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        // 2. ตรวจสอบว่าแอปเปิดแบบ Standalone (ติดตั้งแล้ว) หรือยัง
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

        // ถ้าติดตั้งแล้ว ไม่ต้องทำอะไร (ซ่อนปุ่มไว้เหมือนเดิม)
        if (isStandalone) {
            console.log('App is already installed/standalone.');
            return;
        }

        // === กรณี Android / Desktop (Chrome/Edge) ===
        window.addEventListener('beforeinstallprompt', (e) => {
            // ป้องกันแถบ Install เด้งเองด้านล่าง
            e.preventDefault();
            // เก็บ Event ไว้ใช้ทีหลัง
            deferredPrompt = e;
            // โชว์ปุ่มในหน้าตั้งค่า
            if (installContainer) installContainer.classList.remove('hidden');
        });

        // === กรณี iOS (Safari) ===
        if (isIos) {
            // iOS ไม่มี event beforeinstallprompt แต่เราจะโชว์ปุ่มเลยถ้ายังไม่ Install
            if (installContainer) installContainer.classList.remove('hidden');
        }

        // === จัดการเมื่อกดปุ่ม ===
        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                
                if (isIos) {
                    // --- Logic สำหรับ iOS: แสดง Popup สอนวิธีติดตั้ง ---
                    Swal.fire({
                        title: 'วิธีติดตั้งบน iOS',
                        html: `
                            <div class="text-left text-sm space-y-3">
                                <p>1. กดปุ่ม <b>"แชร์"</b> <i class="fa-solid fa-arrow-up-from-bracket text-blue-500 text-lg mx-1"></i> ที่แถบด้านล่างของ Safari</p>
                                <p>2. เลื่อนหาเมนู <b>"เพิ่มไปยังหน้าจอโฮม"</b> <br>(Add to Home Screen) <i class="fa-regular fa-square-plus text-gray-600 text-lg mx-1"></i></p>
                                <p>3. กดปุ่ม <b>"เพิ่ม"</b> (Add) มุมขวาบน</p>
                            </div>
                        `,
                        icon: 'info',
                        confirmButtonText: 'เข้าใจแล้ว',
                        customClass: { popup: state.isDarkMode ? 'swal2-popup' : '' },
                        background: state.isDarkMode ? '#1a1a1a' : '#fff',
                        color: state.isDarkMode ? '#e5e7eb' : '#545454'
                    });

                } else {
                    // --- Logic สำหรับ Android / PC ---
                    if (deferredPrompt) {
                        // สั่งให้ Prompt เด้งขึ้นมา
                        deferredPrompt.prompt();
                        
                        // รอผลลัพธ์ว่าผู้ใช้กด Install หรือ Cancel
                        const { outcome } = await deferredPrompt.userChoice;
                        console.log(`User response to the install prompt: ${outcome}`);
                        
                        // เคลียร์ตัวแปร (ใช้ได้ครั้งเดียว)
                        deferredPrompt = null;
                        
                        // ถ้าติดตั้งสำเร็จ ซ่อนปุ่มไปเลย
                        if (outcome === 'accepted') {
                            installContainer.classList.add('hidden');
                        }
                    } else {
                        // กรณีไม่มี Prompt (อาจจะติดตั้งแล้ว หรือ Browser ไม่รองรับ)
                        Swal.fire('แจ้งเตือน', 'อุปกรณ์นี้อาจติดตั้งแอปแล้ว หรือไม่รองรับการติดตั้งอัตโนมัติ', 'info');
                    }
                }
            });
        }
    }



// ========================================
// SWIPE NAVIGATION
// ========================================
    function setupSwipeNavigation() {
        const mainContent = document.getElementById('page-wrapper');
        let startX = 0;
        let startY = 0;
        const threshold = 75; 
        const timeThreshold = 500;

        let startTime;
        mainContent.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                startTime = Date.now();
            }
        }, { passive: true });
        mainContent.addEventListener('touchend', (e) => {
            if (e.changedTouches.length === 1 && !isTransitioning) {
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                const endTime = Date.now();

                const diffX = endX - startX;
                const diffY = endY - startY;
                const deltaTime = endTime - startTime;

                if (deltaTime < timeThreshold && Math.abs(diffX) > threshold && Math.abs(diffX) > Math.abs(diffY)) {
                    
                    const currentPageId = 'page-' + currentPage;
                    const currentPageIndex = PAGE_IDS.findIndex(id => id === currentPageId);
                    let nextPageId = null;

                    if (diffX < 0) { // Swipe Left (Next Page)
                        const nextIndex = currentPageIndex + 1;
                        if (nextIndex < PAGE_IDS.length) {
                            nextPageId = PAGE_IDS[nextIndex];
                        }
                    } else { // Swipe Right (Previous Page)
                        const prevIndex = currentPageIndex - 1;
                        if (prevIndex >= 0) {
                            nextPageId = PAGE_IDS[prevIndex];
                        }
                    }

                    if (nextPageId) {
                        showPage(nextPageId);
                    }
                }
            }
        });
    }


    // [แก้ไข] เพิ่มพารามิเตอร์ addToHistory = true


// ========================================
// PAGE NAVIGATION
// ========================================
    function showPage(pageId, addToHistory = true) {
        if (isTransitioning) return;
        resetAutoLockTimer(); 
        const pageName = pageId.replace('page-', '');
        const getEl = (id) => document.getElementById(id);
        
        const oldPageId = 'page-' + currentPage;
        const oldPageEl = getEl(oldPageId);
        const newPageEl = getEl(pageId);
        
        // ถ้าเป็นหน้าเดิม ไม่ต้องทำอะไร
        if (oldPageEl === newPageEl) return;

        // +++ เพิ่มส่วนนี้: สั่งบันทึกลง History ของ Browser +++
        if (addToHistory) {
            // เก็บ state ว่าเราอยู่หน้าไหน
            history.pushState({ pageId: pageId }, null, `#${pageName}`);
        }
        // +++++++++++++++++++++++++++++++++++++++++++++++
        
        isTransitioning = true;
        const oldPageIndex = PAGE_IDS.indexOf(oldPageId);
        const newPageIndex = PAGE_IDS.indexOf(pageId);
        
        // ... (โค้ด Animation เดิมด้านล่างนี้ปล่อยไว้เหมือนเดิม) ...
        const directionClass = (newPageIndex > oldPageIndex) ? 'slide-left' : 'slide-right';

        oldPageEl.classList.add('page-transition-exit-active', directionClass);
        oldPageEl.style.display = 'block'; 
        
        newPageEl.style.display = 'block';
        newPageEl.classList.add('page-transition-enter', directionClass);

        oldPageEl.offsetHeight;
        newPageEl.offsetHeight;

        if (directionClass === 'slide-left') {
            newPageEl.style.transform = 'translateX(100%)';
        } else {
            newPageEl.style.transform = 'translateX(-100%)';
        }
        newPageEl.style.opacity = '0';
        requestAnimationFrame(() => {
            oldPageEl.classList.add('page-transition-exit-final');
            oldPageEl.style.opacity = '0';

            newPageEl.classList.add('page-transition-enter-active');
            newPageEl.classList.remove('page-transition-enter');
        });
        setTimeout(() => {
            oldPageEl.style.display = 'none';
            oldPageEl.classList.remove('page-transition-exit-active', 'page-transition-exit-final', 'slide-left', 'slide-right');
            oldPageEl.style.transform = '';
            oldPageEl.style.opacity = '';
            
            newPageEl.classList.remove('page-transition-enter-active', 'slide-left', 'slide-right');
            newPageEl.style.position = ''; 
            newPageEl.style.transform = '';
            newPageEl.style.opacity = '';
            
            currentPage = pageName;
            isTransitioning = false; 

            // อัปเดตปุ่ม Nav (โค้ดเดิม)
            const navButtons = [
                getEl('nav-home'), getEl('nav-list'), getEl('nav-calendar'), 
                getEl('nav-accounts'), getEl('nav-settings'), getEl('nav-guide')
            ];
            navButtons.forEach(btn => {
                if(btn) { // เพิ่ม check null กัน error
                    btn.classList.remove('text-purple-600');
                    btn.classList.add('text-gray-600');
                }
            });

            // อัปเดตปุ่ม Mobile Nav (โค้ดเดิม)
            const mobileNavButtons = {
                'page-home': getEl('nav-home-mobile'),
                'page-list': getEl('nav-list-mobile'),
                'page-calendar': getEl('nav-calendar-mobile'), 
                'page-accounts': getEl('nav-accounts-mobile'),
                'page-settings': getEl('nav-settings-mobile'),
                'page-guide': getEl('nav-guide-mobile')
            };
            Object.values(mobileNavButtons).forEach(btn => {
                if(btn) {
                    btn.classList.remove('text-purple-600');
                    btn.classList.add('text-gray-600');
                }
            });
            const currentNavEl = getEl('nav-' + currentPage);
            if (currentNavEl) {
                currentNavEl.classList.add('text-purple-600');
                currentNavEl.classList.remove('text-gray-600');
            }
            const currentMobileNavEl = mobileNavButtons[pageId];
            if (currentMobileNavEl) {
                currentMobileNavEl.classList.add('text-purple-600');
                currentMobileNavEl.classList.remove('text-gray-600');
            }

            // Render หน้าต่างๆ (โค้ดเดิม)
            if (pageId === 'page-home') {
                getEl('shared-controls-header').style.display = 'flex';
                updateSharedControls('home');
                renderAll(); 
            } else if (pageId === 'page-list') {
                getEl('shared-controls-header').style.display = 'none';
                //updateSharedControls('list');
                renderListPage();
            } else if (pageId === 'page-calendar') {
                getEl('shared-controls-header').style.display = 'none';
                renderCalendarView();
            } else if (pageId === 'page-accounts') { 
                getEl('shared-controls-header').style.display = 'none';
                renderAccountsPage();
            } else if (pageId === 'page-settings') {
                getEl('shared-controls-header').style.display = 'none';
                renderSettings();
				if (typeof renderCustomNotifyList === 'function') {
                    renderCustomNotifyList();
                }
            } else if (pageId === 'page-guide') {
                getEl('shared-controls-header').style.display = 'none';
            }

        }, 200);
    }




// ========================================
// MAIN RENDER FUNCTIONS
// ========================================
    function renderAll() {
        // 1. ดึงรายการตามวันที่
        let visibleTransactions = getTransactionsForView('home');

        // [เพิ่มส่วนกรองข้อมูล] -----------------------------------------------
        // ถ้าดู "ทั้งหมด" ให้กรองบัญชีที่ปิดสวิตช์ออก
        // แต่ถ้าเลือกบัญชีเจาะจง ให้แสดงบัญชีนั้นเสมอ
        if (state.currentAccountId === 'all' || !state.currentAccountId) {
            const hiddenAccountIds = state.accounts
                .filter(acc => acc.isVisible === false)
                .map(acc => acc.id);
            
            if (hiddenAccountIds.length > 0) {
                visibleTransactions = visibleTransactions.filter(tx => !hiddenAccountIds.includes(tx.accountId));
            }
        }
        // ------------------------------------------------------------------

        const allAccountBalances = getAccountBalances(state.transactions);

        renderSummary(visibleTransactions, allAccountBalances);
        renderAllAccountSummary(allAccountBalances); // อัปเดตการ์ดบัญชีด้านบน
		renderDraftsWidget();
        
        applySettingsPreferences();
        
        const balanceCard = document.getElementById('summary-balance-card');
        const cardsContainer = document.getElementById('summary-cards-container'); 

        if (state.showBalanceCard) {
            balanceCard.classList.remove('hidden');
            if(cardsContainer) {
                cardsContainer.classList.remove('grid-cols-2');
                cardsContainer.classList.add('grid-cols-3');
            }
        } else {
            balanceCard.classList.add('hidden');
            if(cardsContainer) {
                cardsContainer.classList.remove('grid-cols-3');
                cardsContainer.classList.add('grid-cols-2');
            }
        }

        let homeFilteredTxs = visibleTransactions;
        if (state.homeFilterType !== 'all') {
            homeFilteredTxs = visibleTransactions.filter(tx => tx.type === state.homeFilterType);
        }
        renderTransactionList('home-transaction-list-body', homeFilteredTxs, 'home');

        renderPieChart(visibleTransactions);
        renderExpenseByNameChart(visibleTransactions);
		renderBudgetWidget();
    }
	
	// ฟังก์ชันสำหรับสร้างตัวเลือก Auto Complete (ย้ายออกมาเพื่อให้เรียกใช้ได้ตลอด)
    function renderDropdownList() {
        const datalist = document.getElementById('frequent-items-datalist');
        if (!datalist) return;

        datalist.innerHTML = '';
        
        // 1. จากรายการที่ใช้บ่อย (Frequent Items)
        if (state.frequentItems && state.frequentItems.length > 0) {
            state.frequentItems.forEach(item => {
                datalist.insertAdjacentHTML('beforeend', `<option value="${escapeHTML(item)}"></option>`);
            });
        }

        // 2. จากรายการที่จำอัตโนมัติ (Auto Complete)
        if (state.autoCompleteList && state.autoCompleteList.length > 0) {
             state.autoCompleteList.forEach(item => {
                 // ป้องกันซ้ำกับรายการใช้บ่อย
                 if (!state.frequentItems.includes(item.name)) {
                     datalist.insertAdjacentHTML('beforeend', `<option value="${escapeHTML(item.name)}"></option>`);
                 }
            });
        }
    }

    function updateSharedControls(source) {
        const getEl = (id) => document.getElementById(id);
        const viewMode = (source === 'home') ? state.homeViewMode : state.listViewMode;
        const currentDate = (source === 'home') ? state.homeCurrentDate : state.listCurrentDate;
        if (viewMode === 'all') {
            getEl('month-controls').classList.add('hidden');
            getEl('month-controls').classList.remove('flex');
            getEl('year-controls').classList.add('hidden');
            getEl('year-controls').classList.remove('flex');
        } else if (viewMode === 'month') {
            getEl('month-controls').classList.remove('hidden');
            getEl('month-controls').classList.add('flex');
            getEl('year-controls').classList.add('hidden');
            getEl('year-controls').classList.remove('flex');
            const monthYear = currentDate.slice(0, 7);
            getEl('month-picker').value = monthYear;
        } else { 
            getEl('month-controls').classList.add('hidden');
            getEl('month-controls').classList.remove('flex');
            getEl('year-controls').classList.remove('hidden');
            getEl('year-controls').classList.add('flex');
            const year = currentDate.slice(0, 4);
            getEl('year-picker').value = year;
        }
        getEl('view-mode-select').value = viewMode;
    }



// ========================================
// ACCOUNT BALANCE CALCULATION
// ========================================
	function getAccountBalances(allTransactions) {
		const balances = {};
		for (const acc of state.accounts) {
			balances[acc.id] = acc.initialBalance || 0;
		}

		const sortedTxs = [...allTransactions].sort((a, b) => new Date(a.date) - new Date(b.date));
		
		// [แก้ไข] กำหนดให้เป็น 00:00:00 ของวันนี้ เพื่อให้นับรายการของวันนี้ทั้งหมด
		const today = new Date();
		today.setHours(23, 59, 59, 999); // ตั้งเป็นสิ้นสุดของวันนี้ เพื่อให้ครอบคลุมทุกรายการที่ลงวันที่เป็น "วันนี้"

		for (const tx of sortedTxs) {
			const txDate = new Date(tx.date);
			
			// ถ้าวันที่ของรายการ มากกว่า วันนี้ (คือเป็นวันพรุ่งนี้หรืออนาคต) ให้ข้าม
			if (txDate > today) {
				continue;
			}

			const amount = tx.amount;
			// ... (ส่วนการบวกลบยอดเงินด้านล่างเหมือนเดิม) ...
			if (tx.type === 'income') {
				if (balances[tx.accountId] !== undefined) {
					balances[tx.accountId] += amount;
				}
			} else if (tx.type === 'expense') {
				 if (balances[tx.accountId] !== undefined) {
					balances[tx.accountId] -= amount;
				}
			} else if (tx.type === 'transfer') {
				if (balances[tx.accountId] !== undefined) { 
					balances[tx.accountId] -= amount;
				}
				if (balances[tx.toAccountId] !== undefined) { 
					balances[tx.toAccountId] += amount;
				}
			}
		}
		return balances;
	}



// ========================================
// SUMMARY RENDERING
// ========================================
		function renderSummary(transactionsForPeriod, allAccountBalances) {
			// [แก้ไข] กำหนดเวลาเป็นสิ้นสุดของวันนี้ เพื่อให้นับรายการวันนี้ทั้งหมด
			const today = new Date();
			today.setHours(23, 59, 59, 999);

			const periodTotals = transactionsForPeriod.reduce((acc, tx) => {
				const txDate = new Date(tx.date);
				
				// ถ้าวันที่รายการ > วันนี้ (คือเป็นอนาคต) ไม่ต้องนำมานับรวม
				if (txDate > today) {
					return acc;
				}

				if (tx.type === 'income') {
					acc.income += tx.amount;
				} else if (tx.type === 'expense') {
					acc.expense += tx.amount;
				}
				return acc;
			}, { income: 0, expense: 0 });

			// ... (ส่วนแสดงผลด้านล่างเหมือนเดิม) ...
			let totalCashBalance = 0;
			const sortedAccounts = getSortedAccounts();
			for (const acc of sortedAccounts) { 
				if (acc.type === 'cash') {
					totalCashBalance += allAccountBalances[acc.id] || 0;
				}
			}

			document.getElementById('total-income').textContent = formatCurrency(periodTotals.income);
			document.getElementById('total-expense').textContent = formatCurrency(periodTotals.expense);
			
			const totalBalanceEl = document.getElementById('total-balance');
			totalBalanceEl.textContent = formatCurrency(totalCashBalance);
		}

    function renderAllAccountSummary(balances) {
        const container = document.getElementById('all-accounts-summary');
        container.innerHTML = ''; 
        
        const sortedAccounts = getSortedAccounts(); 

        if (sortedAccounts.length === 0) { 
            container.innerHTML = `<p class="text-gray-500 col-span-full text-center">ยังไม่มีบัญชี
            <button id="nav-settings-shortcut" class="text-purple-600 hover:underline">สร้างบัญชีใหม่ในหน้าตั้งค่า</button>
            </p>`;
            document.getElementById('nav-settings-shortcut').addEventListener('click', () => showPage('page-accounts'));
            return;
        }
        
        sortedAccounts.forEach(acc => { 
            // [เพิ่ม] ถ้าถูกปิดสวิตช์ ไม่ต้องแสดงการ์ดนี้
            if (acc.isVisible === false) return;

            const balance = balances[acc.id] || 0;
            let balanceClass = 'balance-zero';
            if (balance > 0) balanceClass = 'balance-positive';
            if (balance < 0) balanceClass = 'balance-negative';
            
            const currentIcon = acc.iconName || acc.icon || 'fa-wallet';

            const cardHtml = `
                <div class="bg-gray-50 p-3 rounded-xl shadow-md border border-gray-200 compact-account-card cursor-pointer" data-id="${acc.id}">
                    <div class="flex items-center gap-3">
                        <i class="fa-solid ${currentIcon} text-purple-600 text-lg"></i>
                        <h3 class="text-base font-semibold text-gray-800 truncate">${escapeHTML(acc.name)}</h3>
                    </div>
                    <div class="w-full mt-2">
                        <p class="text-lg font-bold text-right ${balanceClass} truncate">${formatCurrency(balance)}</p>
                        <p class="text-xs text-gray-500 text-right">${acc.type === 'credit' ? 'บัตรเครดิต' : (acc.type === 'liability' ? 'หนี้สิน' : 'เงินสด')}</p>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', cardHtml);
        });
    }

    // ============================================
	// [NEW] ADVANCED RENDER LIST PAGE
	// ============================================


// ========================================
// LIST PAGE RENDERING
// ========================================
	function renderListPage() {
		const getEl = (id) => document.getElementById(id);
		
		// 1. ดึงค่าจาก Input กรองต่างๆ
		const startDate = getEl('adv-filter-start').value;
		const endDate = getEl('adv-filter-end').value;
		const filterType = getEl('adv-filter-type').value;
		const searchTerm = getEl('adv-filter-search').value.toLowerCase().trim();

		// ปุ่ม Clear Search
		const btnClear = getEl('btn-clear-search');
		if(searchTerm.length > 0) btnClear.classList.remove('hidden');
		else btnClear.classList.add('hidden');

		// 2. กรองข้อมูล (Filtering)
		// เริ่มจากรายการทั้งหมดในระบบ
		let filtered = state.transactions.filter(tx => {
			const txDate = tx.date.slice(0, 10); // เอาเฉพาะ YYYY-MM-DD
			
			// 2.1 กรองวันที่ (Start <= Date <= End)
			// กรณี User ไม่เลือกวันที่ (ว่าง) ให้ถือว่าผ่าน
			const isDateInRange = (!startDate || txDate >= startDate) && 
								  (!endDate || txDate <= endDate);
			if (!isDateInRange) return false;

			// 2.2 กรองประเภท (Type)
			if (filterType !== 'all' && tx.type !== filterType) return false;

			// 2.3 กรองคำค้นหา (Search Keyword)
			if (searchTerm) {
				const amountStr = String(tx.amount);
				const fromAccount = state.accounts.find(a => a.id === tx.accountId);
				const toAccount = state.accounts.find(a => a.id === tx.toAccountId);
				const fromAccName = fromAccount ? fromAccount.name.toLowerCase() : '';
				const toAccName = toAccount ? toAccount.name.toLowerCase() : '';
				const category = tx.category ? tx.category.toLowerCase() : '';
				const name = tx.name ? tx.name.toLowerCase() : '';
				const desc = tx.desc ? tx.desc.toLowerCase() : ''; // Note

				// เช็คว่ามีคำค้นอยู่ใน field ไหนบ้าง
				const matches = name.includes(searchTerm) || 
								category.includes(searchTerm) || 
								desc.includes(searchTerm) ||
								fromAccName.includes(searchTerm) ||
								toAccName.includes(searchTerm) ||
								amountStr.includes(searchTerm);
				
				if (!matches) return false;
			}

			return true;
		});

		// 3. เรียงลำดับ (วันที่ใหม่สุดขึ้นก่อน)
		filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

		// 4. [HIGHLIGHT] คำนวณ Dynamic Summary (สรุปยอดจากรายการที่เห็น)
		let sumIncome = 0;
		let sumExpense = 0;
		
		filtered.forEach(tx => {
			if (tx.type === 'income') sumIncome += tx.amount;
			else if (tx.type === 'expense') sumExpense += tx.amount;
		});
		
		const sumNet = sumIncome - sumExpense;

		// อัปเดตตัวเลขบนหน้าจอ
		getEl('dyn-sum-income').textContent = formatCurrency(sumIncome);
		getEl('dyn-sum-expense').textContent = formatCurrency(sumExpense);
		
		const netEl = getEl('dyn-sum-net');
		netEl.textContent = formatCurrency(sumNet);
		// เปลี่ยนสีตามยอดคงเหลือ
		if (sumNet > 0) { netEl.className = "text-sm md:text-base font-bold text-green-600"; }
		else if (sumNet < 0) { netEl.className = "text-sm md:text-base font-bold text-red-600"; }
		else { netEl.className = "text-sm md:text-base font-bold text-gray-600"; }

		getEl('dyn-count-display').textContent = `${filtered.length} รายการ`;
		
		// ------------------------------------
		// [NEW] เรียกแสดงกราฟ
		renderAnalyticsChart(filtered);
		// ------------------------------------

		// 5. แสดงผลรายการ (Pagination)
		// ใช้ state.listItemsPerPage ที่มีอยู่เดิม
		renderTransactionList('transaction-list-body', filtered, 'list');
	}
	
	// ============================================
	// [แก้ไข] FUNCTION EXPORT FILTERED LIST (ตั้งชื่อไฟล์ตามสิ่งที่ค้นหา)
	// ============================================


// ========================================
// EXPORT FUNCTIONS
// ========================================
	function exportFilteredList() {
		if (typeof XLSX === 'undefined') {
			Swal.fire('Error', 'ไม่พบ Library สำหรับสร้าง Excel', 'error');
			return;
		}

		const getEl = (id) => document.getElementById(id);
		const startDate = getEl('adv-filter-start').value;
		const endDate = getEl('adv-filter-end').value;
		const filterType = getEl('adv-filter-type').value;
		const searchTerm = getEl('adv-filter-search').value.toLowerCase().trim();

		let filtered = state.transactions.filter(tx => {
			const txDate = tx.date.slice(0, 10);
			const isDateInRange = (!startDate || txDate >= startDate) && 
								  (!endDate || txDate <= endDate);
			if (!isDateInRange) return false;
			
			if (filterType !== 'all' && tx.type !== filterType) return false;
			
			if (searchTerm) {
				const amountStr = String(tx.amount);
				const fromAccount = state.accounts.find(a => a.id === tx.accountId);
				const toAccount = state.accounts.find(a => a.id === tx.toAccountId);
				const fromAccName = fromAccount ? fromAccount.name.toLowerCase() : '';
				const toAccName = toAccount ? toAccount.name.toLowerCase() : '';
				const category = tx.category ? tx.category.toLowerCase() : '';
				const name = tx.name ? tx.name.toLowerCase() : '';
				const desc = tx.desc ? tx.desc.toLowerCase() : '';
				
				const matches = name.includes(searchTerm) || 
								category.includes(searchTerm) || 
								desc.includes(searchTerm) ||
								fromAccName.includes(searchTerm) ||
								toAccName.includes(searchTerm) ||
								amountStr.includes(searchTerm);
				if (!matches) return false;
			}
			return true;
		});

		if (filtered.length === 0) {
			Swal.fire('ไม่มีข้อมูล', 'ไม่พบรายการตามเงื่อนไขที่กำหนด', 'warning');
			return;
		}

		Swal.fire({
			title: 'ยืนยันการ Export Excel?',
			html: `
				<div class="text-left text-sm text-gray-600">
					<p><b>จำนวนรายการ:</b> ${filtered.length} รายการ</p>
					<p><b>ช่วงวันที่:</b> ${startDate} ถึง ${endDate}</p>
					<p><b>เงื่อนไข:</b> ${searchTerm ? '"'+searchTerm+'"' : 'ทั้งหมด'} (${filterType})</p>
				</div>
			`,
			icon: 'question',
			showCancelButton: true,
			confirmButtonColor: '#16a34a',
			cancelButtonColor: '#d33',
			confirmButtonText: '<i class="fa-solid fa-file-excel"></i> ดาวน์โหลดเลย',
			cancelButtonText: 'ยกเลิก'
		}).then((result) => {
			if (result.isConfirmed) {
				
				filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

				let sumIncome = 0;
				let sumExpense = 0;
				filtered.forEach(tx => {
					if (tx.type === 'income') sumIncome += tx.amount;
					else if (tx.type === 'expense') sumExpense += tx.amount;
				});
				const sumNet = sumIncome - sumExpense;

				const dataRows = filtered.map(tx => {
					const d = new Date(tx.date);
					const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
					const timeStr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
					
					let typeLabel = tx.type === 'income' ? 'รายรับ' : (tx.type === 'expense' ? 'รายจ่าย' : 'โอนย้าย');
					let amount = tx.amount;
					if (tx.type === 'expense') amount = -amount;
					
					return {
						"วันที่": dateStr,
						"เวลา": timeStr,
						"ประเภท": typeLabel,
						"รายการ": tx.name,
						"หมวดหมู่": tx.category,
						"จำนวนเงิน": amount,
						"บัญชี": state.accounts.find(a => a.id === tx.accountId)?.name || '-',
						"หมายเหตุ": tx.desc || ''
					};
				});

				const ws = XLSX.utils.json_to_sheet(dataRows, { origin: "A7" });

				const summaryHeader = [
					[`สรุปรายการค้นหา (Filtered Report)`],
					[`ช่วงเวลา: ${startDate} ถึง ${endDate}`],
					[`เงื่อนไข: "${searchTerm}" | ประเภท: ${filterType}`],
					[], 
					["สรุปยอดรวม", "จำนวนเงิน (บาท)"],
					["รายรับรวม", sumIncome],
					["รายจ่ายรวม", sumExpense],
					["ยอดสุทธิ", sumNet],
					[] 
				];

				XLSX.utils.sheet_add_aoa(ws, summaryHeader, { origin: "A1" });

				ws['!cols'] = [
					{wch: 12}, {wch: 8}, {wch: 10}, {wch: 20}, {wch: 15}, {wch: 12}, {wch: 15}, {wch: 30}
				];

				const wb = XLSX.utils.book_new();
				XLSX.utils.book_append_sheet(wb, ws, "FilteredData");

				// --- [ส่วนที่เพิ่ม] ตั้งชื่อไฟล์แบบ Dynamic ---
				let fileName = 'Export';
				
				// 1. ถ้ามีคำค้นหา ให้ใช้คำค้นหาเป็นชื่อไฟล์
				if (searchTerm) {
					// แทนที่ตัวอักษรพิเศษที่ไม่ควรอยู่ในชื่อไฟล์
					const safeSearchTerm = searchTerm.replace(/[/\\?%*:|"<>]/g, '-');
					fileName += `_${safeSearchTerm}`;
				} 
				// 2. ถ้าไม่มีคำค้นหา แต่เลือกประเภท (รายรับ/จ่าย) ให้ใส่ชื่อประเภท
				else if (filterType !== 'all') {
					const typeMap = { 'income': 'รายรับ', 'expense': 'รายจ่าย', 'transfer': 'โอนย้าย' };
					fileName += `_${typeMap[filterType] || filterType}`;
				}
				
				// 3. ปิดท้ายด้วยช่วงวันที่
				fileName += `_${startDate}_to_${endDate}.xlsx`;
				
				XLSX.writeFile(wb, fileName);
				// ------------------------------------------
				
				const Toast = Swal.mixin({
					toast: true,
					position: 'top-end',
					showConfirmButton: false,
					timer: 3000,
					timerProgressBar: true
				});
				Toast.fire({
					icon: 'success',
					title: `ดาวน์โหลดไฟล์: ${fileName} เรียบร้อย`
				});
			}
		});
	}

    


// ========================================
// TRANSACTION LIST RENDERING
// ========================================
    function createTransactionTableHTML(tbodyId) {
        return `
        <table class="w-full text-left">
            <thead>
                <tr class="border-b border-gray-200">
                    <th class="p-2 text-lg text-gray-700 font-semibold">วันที่</th>
                    <th class="p-2 text-lg text-gray-700 font-semibold">ชื่อรายการ/บัญชี</th>
             <th class="p-2 text-lg text-gray-700 font-semibold">หมวดหมู่</th>
                    <th class="p-2 text-lg text-gray-700 font-semibold text-right">จำนวนเงิน</th>
                    <th class="p-2 text-lg text-gray-700 font-semibold text-center">จัดการ</th>
                </tr>
            </thead>
            <tbody id="${tbodyId}">
                <tr>
                    <td colspan="5" class="p-6 text-center text-gray-500">ไม่มีรายการ...</td>
                </tr>
            </tbody>
        </table>
        `;
    }

    function renderTransactionList(tbodyId, allTransactions, source) {
        const listBody = document.getElementById(tbodyId);
        listBody.innerHTML = ''; 
        const isListPage = (source === 'list');
        const groupBy = isListPage ? state.listGroupBy : 'none'; 

        allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (groupBy !== 'none' && isListPage) {
            const grouped = {};
            allTransactions.forEach(tx => {
                let key;
                const dateObj = new Date(tx.date);
                if (groupBy === 'day') {
                    key = tx.date.slice(0, 10);
                } else { // month
                    key = tx.date.slice(0, 7); 
                }

                if (!grouped[key]) grouped[key] = { transactions: [], income: 0, expense: 0 };
                grouped[key].transactions.push(tx);
                if (tx.type === 'income') grouped[key].income += tx.amount;
                else if (tx.type === 'expense') grouped[key].expense += tx.amount;
            });

            const sortedGroups = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
            let fullHtml = '';

            sortedGroups.forEach(key => {
                const groupData = grouped[key];
                const netBalance = groupData.income - groupData.expense;
                const netClass = netBalance >= 0 ? 'text-green-600' : 'text-red-600';
                
                let title;
                if (groupBy === 'day') {
                    title = new Date(key).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                } else { // month
                    const [y, m] = key.split('-');
                    title = new Date(y, m - 1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
                }

                fullHtml += `
                    <tr class="bg-gray-200 dark:bg-gray-700">
                        <td colspan="5" class="p-3 text-lg font-bold text-gray-800 dark:text-gray-100">
                            ${title}
                            <span class="float-right text-base font-medium">
                                รายรับ: <span class="text-green-600">${formatCurrency(groupData.income)}</span> / 
                                รายจ่าย: <span class="text-red-600">${formatCurrency(groupData.expense)}</span> / 
                                สุทธิ: <span class="${netClass}">${formatCurrency(netBalance)}</span>
                            </span>
                        </td>
                    </tr>
                `;

                groupData.transactions.forEach(tx => {
                    fullHtml += createTransactionRowHtml(tx); 
                });
            });

            listBody.innerHTML = fullHtml;
            document.getElementById('list-pagination-controls').innerHTML = ''; 
            return;
        } 
        
        const currentPage = (source === 'home') ? state.homeCurrentPage : state.listCurrentPage;
        const itemsToShow = (source === 'list') ? state.listItemsPerPage : state.homeItemsPerPage;
        const totalPages = Math.ceil(allTransactions.length / itemsToShow);
        const startIndex = (currentPage - 1) * itemsToShow;
        const endIndex = startIndex + itemsToShow;
        const paginatedTransactions = allTransactions.slice(startIndex, endIndex);

        if (allTransactions.length === 0) {
            listBody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-gray-500">ไม่มีรายการ...</td></tr>';
            renderPaginationControls(source, 0, 1);
            return;
        }

        paginatedTransactions.forEach(tx => {
            listBody.insertAdjacentHTML('beforeend', createTransactionRowHtml(tx));
        });

        renderPaginationControls(source, totalPages, currentPage);
    }

    function createTransactionRowHtml(tx) {
        const date = new Date(tx.date);
        const formattedDate = date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
        const formattedTime = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        
        const isFuture = date > new Date();
        const futureBadge = isFuture ? 
            `<span class="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full ml-2 border border-yellow-200">
                <i class="fa-solid fa-clock mr-1"></i>ล่วงหน้า
            </span>` : '';
        const rowOpacity = isFuture ? 'opacity-70' : ''; 
        
        let name, category, amount, amountClass, amountSign;
        
        // --- แก้ไขการดึงชื่อบัญชี (เอา .toLowerCase() ออก และใส่ค่า Default) ---
        const fromAccount = state.accounts.find(a => a.id === tx.accountId);
        const toAccount = state.accounts.find(a => a.id === tx.toAccountId);
        
        // ถ้าหาไม่เจอ ให้แสดงชื่อเดิมที่บันทึกไว้ใน tx (ถ้ามี) หรือแสดงคำว่า 'ไม่ระบุ'
        const fromAccName = fromAccount ? escapeHTML(fromAccount.name) : '<span class="text-red-400">ไม่พบบัญชี</span>';
        const toAccName = toAccount ? escapeHTML(toAccount.name) : '<span class="text-red-400">ไม่พบบัญชี</span>';
        // ----------------------------------------------------------------
        
        const receiptIcon = tx.receiptBase64 ? 
            `<button type="button" class="view-receipt-icon text-purple-500 hover:text-purple-700 ml-2 z-10 relative" data-base64="${tx.receiptBase64}" title="คลิกเพื่อดูรูป">
                <i class="fa-solid fa-receipt"></i>
            </button>` : '';

        if (tx.type === 'transfer') {
            name = `<span class="font-bold text-blue-600">${escapeHTML(tx.name)}</span>${receiptIcon}${futureBadge}`;
            category = `<div class="text-sm">
                            <span class="text-gray-500">จาก:</span> ${fromAccName}<br>
                            <span class="text-gray-500">ไป:</span> ${toAccName}
                        </div>`;
            amount = formatCurrency(tx.amount);
            amountClass = 'text-blue-600';
            amountSign = '';
        } else {
            name = escapeHTML(tx.name) + receiptIcon + futureBadge;
            category = `<span class="block">${escapeHTML(tx.category)}</span>
                        <span class="text-sm text-purple-600">${fromAccName}</span>`;
            amount = formatCurrency(tx.amount);
            
            if (tx.type === 'income') {
                amountClass = 'text-green-600';
                amountSign = '+';
            } else {
                amountClass = 'text-red-600';
                amountSign = '-';
            }
        }

        return `
            <tr class="border-b border-gray-100 hover:bg-gray-50 ${rowOpacity}">
                <td class="p-2 text-lg text-gray-700">
                    ${formattedDate} <span class="block text-base text-gray-500">${formattedTime} น.</span>
                </td>
                <td class="p-2 text-lg text-gray-700 font-medium break-word">
                    ${name}
                    ${tx.desc ? `<p class="text-base text-gray-500">${escapeHTML(tx.desc)}</p>` : ''}
                </td>
                <td class="p-2 text-lg text-gray-700 break-word">${category}</td>
                <td class="p-2 text-lg ${amountClass} font-semibold text-right whitespace-nowrap">${amountSign}${amount}</td>
                <td class="p-2 text-lg text-center">
                    <div class="flex flex-col md:flex-row items-center justify-center">
                        <button class="edit-btn text-blue-500 hover:text-blue-700 p-2" data-id="${tx.id}">
                            <i class="fa-solid fa-pencil"></i>
                        </button>
                        <button class="delete-btn text-red-500 hover:text-red-700 p-2" data-id="${tx.id}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }




// ========================================
// CALENDAR RENDERING
// ========================================
	async function renderCalendarView() {
		try {
			const calendarEl = document.getElementById('calendar-container');
			const yearInput = document.getElementById('cal-year-input');

			if (!calendarEl || !yearInput) return;

			let currentYearVal = parseInt(yearInput.value);
			if (isNaN(currentYearVal)) {
				currentYearVal = new Date(state.calendarCurrentDate || new Date()).getFullYear();
			}

			const onlineHolidays = (typeof fetchPublicHolidays === 'function') ? await fetchPublicHolidays(currentYearVal) : {};
			const buddhistDays = (typeof calculateBuddhistHolyDays === 'function') ? calculateBuddhistHolyDays(currentYearVal) : [];

			const showHoliday = document.getElementById('cal-toggle-holiday')?.checked ?? true;
			const showBuddhist = document.getElementById('cal-toggle-buddhist')?.checked ?? true;
			const showMoney = document.getElementById('cal-toggle-money')?.checked ?? true;

			const calendarEvents = [];

			// --- (ส่วนสร้าง Events: วันหยุด/วันพระ/ยอดเงิน ใช้โค้ดเดิม) ---
			if (showHoliday) {
				for (const [date, name] of Object.entries(onlineHolidays)) {
					calendarEvents.push({ id: 'hol-' + date, start: date, allDay: true, display: 'background', backgroundColor: '#fee2e2', classNames: ['holiday-bg-event'] });
					calendarEvents.push({ id: 'hol-txt-' + date, title: name, start: date, allDay: true, color: 'transparent', textColor: '#ef4444', classNames: ['font-bold', 'text-xs', 'holiday-text-label'] });
				}
			}
			if (showBuddhist) {
				buddhistDays.forEach(date => {
					calendarEvents.push({ id: 'bud-' + date, title: '🙏 วันพระ', start: date, allDay: true, color: '#fef08a', textColor: '#854d0e', classNames: ['text-xs', 'font-medium', 'buddhist-event'] });
				});
			}
			if (showMoney && state.transactions) {
				const dailyTotals = {};
				state.transactions.forEach(tx => {
					const dateStr = tx.date.slice(0, 10);
					if (!dailyTotals[dateStr]) dailyTotals[dateStr] = { income: 0, expense: 0 };
					if (tx.type === 'expense') dailyTotals[dateStr].expense += tx.amount;
					else if (tx.type === 'income') dailyTotals[dateStr].income += tx.amount;
				});
				Object.keys(dailyTotals).forEach(date => {
					const totals = dailyTotals[date];
					const isFuture = date > new Date().toISOString().slice(0, 10);
					if (totals.income > 0) calendarEvents.push({ id: date + '-inc', title: '+' + formatCurrency(totals.income).replace(/[^\d.,-]/g, ''), start: date, allDay: true, color: '#22c55e', classNames: ['money-event'] });
					if (totals.expense > 0) calendarEvents.push({ id: date + '-exp', title: '-' + formatCurrency(totals.expense).replace(/[^\d.,-]/g, ''), start: date, allDay: true, color: (isFuture ? '#f59e0b' : '#ef4444'), classNames: ['money-event'] });
				});
			}

			// --- Events แจ้งเตือนพิเศษ (ฉบับแก้ไข: แก้ปัญหา Timezone และวันล้นเดือน) ---
            if (state.customNotifications) {
                state.customNotifications.forEach(notif => {
                    // 1. แยกชิ้นส่วนวันที่เอง เพื่อป้องกัน Timezone เพี้ยน (บังคับเป็น Local Time)
                    const parts = notif.date.split('-'); 
                    const startYear = parseInt(parts[0]);
                    const startMonth = parseInt(parts[1]) - 1; // เดือนใน JS เริ่มที่ 0 (ม.ค.=0)
                    const startDay = parseInt(parts[2]);

                    const startDateObj = new Date(startYear, startMonth, startDay);
                    const repeat = notif.repeat || 'none';
                    const targetYear = currentYearVal; // ปีที่ปฏิทินกำลังแสดง

                    // ฟังก์ชันช่วยใส่ Event ลงปฏิทิน
                    const addEvent = (d) => {
                        // จัดรูปแบบ YYYY-MM-DD โดยใช้ Local Time ไม่แปลงเป็น UTC
                        const year = d.getFullYear();
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        const dateStr = `${year}-${month}-${day}`;

                        let startVal = dateStr;
                        let isAllDayEvt = true;
                        
                        if (notif.isAllDay === false && notif.time) {
                            startVal = `${dateStr}T${notif.time}`;
                            isAllDayEvt = false;
                        }

                        calendarEvents.push({
                            id: notif.id,
                            title: notif.message,
                            start: startVal,
                            allDay: isAllDayEvt,
                            color: '#7c3aed',
                            textColor: '#ffffff',
                            classNames: ['custom-notify-event', 'text-xs'],
                            extendedProps: { originalDate: notif.date }
                        });
                    };

                    if (repeat === 'none') {
                        // --- ไม่ซ้ำ ---
                        // เช็คปีให้ตรงกัน
                        if (startYear === targetYear) {
                            addEvent(startDateObj);
                        }

                    } else if (repeat === 'weekly') {
                        // --- ทุกสัปดาห์ ---
                        let d = new Date(startYear, startMonth, startDay);
                        
                        // ข้ามปีเก่าๆ มาปีปัจจุบันให้เร็วขึ้น (Performance)
                        // ถ้าปีเริ่มต้น เก่ากว่าปีปัจจุบันมาก ให้ขยับทีละ 1 ปี (แบบหยาบ) ก่อน
                        if (d.getFullYear() < targetYear - 1) {
                             d.setFullYear(targetYear - 1); 
                             // พอขยับปี วันในสัปดาห์จะเปลี่ยน ต้องจูนกลับมาให้ตรงวันเดิม (จันทร์, อังคาร ฯลฯ)
                             while (d.getDay() !== startDateObj.getDay()) {
                                 d.setDate(d.getDate() + 1);
                             }
                        }

                        // วนลูปทีละ 7 วัน
                        while (d.getFullYear() <= targetYear) {
                            // ต้องไม่ใช่อดีตก่อนวันเริ่ม และต้องอยู่ในปีที่แสดงผล
                            if (d >= startDateObj && d.getFullYear() === targetYear) {
                                addEvent(d);
                            }
                            d.setDate(d.getDate() + 7);
                            
                            // กันลูปไม่รู้จบ
                            if (d.getFullYear() > targetYear + 1) break;
                        }

                    } else if (repeat === 'monthly') {
                        // --- ทุกเดือน ---
                        for (let m = 0; m < 12; m++) {
                            // สร้างวันที่ในเดือนนั้นๆ ของปีที่แสดง
                            // *ทริค: ใช้ startDay ตรงๆ
                            const checkDate = new Date(targetYear, m, startDay);

                            // เช็ค 1: วันล้นเดือนหรือไม่? (สำคัญมาก)
                            // เช่น ตั้งวันที่ 31 แล้วไปเช็คเดือนกุมภา (m=1) JS จะปัดเป็น 3 มีนา
                            // checkDate.getMonth() จะได้ 2 (มีนา) ซึ่งไม่ตรงกับ m (กุมภา) -> แปลว่าเดือนนั้นไม่มีวันที่ 31
                            if (checkDate.getMonth() !== m) continue;

                            // เช็ค 2: ต้องไม่ก่อนวันเริ่ม
                            if (checkDate < startDateObj) continue;

                            addEvent(checkDate);
                        }

                    } else if (repeat === 'yearly') {
                        // --- ทุกปี ---
                        const checkDate = new Date(targetYear, startMonth, startDay);

                        // เช็ค: วันล้นเดือน (กรณี 29 ก.พ. ในปีที่ไม่ใช่อธิกสุรทิน)
                        if (checkDate.getMonth() === startMonth) {
                             if (checkDate >= startDateObj) {
                                addEvent(checkDate);
                             }
                        }
                    }
                });
            }

			if (typeof myCalendar !== 'undefined' && myCalendar) myCalendar.destroy();

			const initialDate = state.calendarCurrentDate || new Date().toISOString().slice(0, 10);
			yearInput.value = new Date(initialDate).getFullYear();

			myCalendar = new FullCalendar.Calendar(calendarEl, {
				initialView: 'dayGridMonth',
				initialDate: initialDate,
				locale: 'th',
				contentHeight: 'auto',
				buttonText: { today: 'วันนี้' },
				headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
				showNonCurrentDates: false,
				fixedWeekCount: false,
				events: calendarEvents,
				eventOrder: "start,-duration,allDay,title",

				// [จุดสำคัญ] เมื่อคลิกวันที่ -> เรียก showDailyDetails เพื่อโชว์รายการ+ปุ่มกด
				dateClick: function(info) {
					showDailyDetails(info.dateStr);
				},
				eventClick: function(info) {
					const dateStr = info.event.startStr.slice(0, 10);
					showDailyDetails(dateStr);
				},
				
				datesSet: function(info) {
					const currentStart = info.view.currentStart;
					const offset = currentStart.getTimezoneOffset();
					const localDate = new Date(currentStart.getTime() - (offset * 60 * 1000));
					state.calendarCurrentDate = localDate.toISOString().slice(0, 10);
					
					if (parseInt(yearInput.value) !== currentStart.getFullYear()) {
						yearInput.value = currentStart.getFullYear();
						renderCalendarView();
					}
				}
			});
			myCalendar.render();

		} catch (err) {
			console.error('Error rendering calendar:', err);
		}
	}

	// ============================================
	// 2. ฟังก์ชันแสดงรายละเอียดรายวัน (Popup รายการ + ปุ่มกด)
	// ============================================


// ========================================
// DAILY DETAILS MODAL
// ========================================
	async function showDailyDetails(dateStr) {
		// 1. ดึงรายการรายรับ-รายจ่าย
		const dailyTx = state.transactions.filter(t => t.date.slice(0, 10) === dateStr);
		
		// 2. ดึงรายการแจ้งเตือน
		const dailyNotif = state.customNotifications.filter(n => n.date === dateStr);
		
		// สร้าง HTML สำหรับ Transactions
		let txHtml = '';
		if (dailyTx.length > 0) {
			txHtml = '<ul class="space-y-2 mb-4">';
			dailyTx.forEach(tx => {
				const colorClass = tx.type === 'income' ? 'text-green-600' : 'text-red-600';
				const sign = tx.type === 'income' ? '+' : '-';
				txHtml += `
					<li class="flex justify-between items-center text-sm border-b pb-1 border-gray-100">
						<span class="text-gray-700 truncate w-2/3 text-left">• ${tx.name}</span>
						<span class="${colorClass} font-bold">${sign}${formatCurrency(tx.amount)}</span>
					</li>`;
			});
			txHtml += '</ul>';
		} else {
			txHtml = '<p class="text-gray-400 text-sm mb-4 italic text-center">- ไม่มีรายการการเงิน -</p>';
		}

		// สร้าง HTML สำหรับ Notifications
		let notifyHtml = '';
		if (dailyNotif.length > 0) {
			notifyHtml = '<div class="mb-4"><h5 class="font-bold text-gray-700 text-sm mb-2 text-left">แจ้งเตือน:</h5><ul class="space-y-2">';
			dailyNotif.forEach(n => {
				let timeBadge = (n.isAllDay === false && n.time) 
					? `<span class="text-[10px] bg-purple-100 text-purple-700 px-1 rounded ml-1">${n.time} น.</span>`
					: `<span class="text-[10px] bg-gray-100 text-gray-500 px-1 rounded ml-1">ทั้งวัน</span>`;
				
				notifyHtml += `
					<li class="flex justify-between items-center bg-purple-50 p-2 rounded text-sm text-gray-700">
						<span>${n.message}</span>
						${timeBadge}
					</li>`;
			});
			notifyHtml += '</ul></div>';
		}

		// แสดง Popup
		await Swal.fire({
			title: `รายละเอียด (${dateStr})`,
			html: `
				<div class="px-2">
					${txHtml}
					${notifyHtml}
					<hr class="my-4 border-gray-200">
					<div class="grid grid-cols-2 gap-3">
						<button id="cal-btn-add-tx" class="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm flex items-center justify-center transition">
							<i class="fa-solid fa-plus-circle mr-2"></i> รายรับ-รายจ่าย
						</button>
						<button id="cal-btn-add-notif" class="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm flex items-center justify-center transition">
							<i class="fa-solid fa-bell mr-2"></i> แจ้งเตือน
						</button>
					</div>
				</div>
			`,
			showConfirmButton: false,
			showCloseButton: true,
			didOpen: () => {
				// -- ปุ่มเพิ่มรายรับ-รายจ่าย --
				document.getElementById('cal-btn-add-tx').onclick = () => {
					Swal.close();
					// พยายามเปิดหน้าเพิ่มรายการ (กำหนดวันที่ให้ถ้ามี input id="date")
					const dateInput = document.getElementById('date'); // สมมติ ID ของ input วันที่
					if (dateInput) dateInput.value = dateStr;
					
					// เรียกฟังก์ชันเปิด Modal (ลองเรียกชื่อมาตรฐาน)
					const addModal = document.getElementById('add-modal');
					if (addModal) {
						addModal.classList.remove('hidden');
					} else {
						// ถ้าหาไม่เจอ ให้เลื่อนหน้าจอขึ้นบนสุด (กรณีเป็น Form หน้าหลัก)
						window.scrollTo({ top: 0, behavior: 'smooth' });
					}
				};

				// -- ปุ่มเพิ่มแจ้งเตือน (เรียกฟังก์ชันใหม่) --
				document.getElementById('cal-btn-add-notif').onclick = () => {
					Swal.close();
					openCalAddNotify(dateStr); // ไปเปิดหน้าต่างเพิ่มแจ้งเตือนแบบมีเวลา
				};
			}
		});
	}

	// ============================================
	// 3. ฟังก์ชันเปิดหน้าต่างเพิ่มแจ้งเตือน (แบบระบุเวลา)
	// ============================================
	async function openCalAddNotify(dateStr) {
		const { value: formValues } = await Swal.fire({
			title: `เพิ่มการแจ้งเตือน (${dateStr})`,
			html: `
				<div class="text-left">
					<label class="block text-sm font-bold text-gray-700 mb-1">ข้อความ:</label>
					<input id="swal-evt-msg" class="swal2-input" placeholder="พิมพ์ข้อความ..." style="margin: 0 0 15px 0; width: 100%;">
					
					<label class="block text-sm font-bold text-gray-700 mb-2">เวลาแจ้งเตือน:</label>
					<div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
						<div class="flex flex-col gap-2 mb-2">
							<label class="inline-flex items-center cursor-pointer">
								<input type="radio" name="swal-time-type" value="allday" class="form-radio text-purple-600 w-4 h-4" checked 
									onchange="document.getElementById('swal-time-input-box').classList.add('hidden')">
								<span class="ml-2 text-sm text-gray-700">เตือนทั้งวัน (00:00)</span>
							</label>
							<label class="inline-flex items-center cursor-pointer">
								<input type="radio" name="swal-time-type" value="specific" class="form-radio text-purple-600 w-4 h-4"
										onchange="document.getElementById('swal-time-input-box').classList.remove('hidden')">
								<span class="ml-2 text-sm text-gray-700">ระบุเวลาเอง</span>
							</label>
						</div>
						<div id="swal-time-input-box" class="hidden mt-1 pl-6">
							<input type="time" id="swal-evt-time" class="p-2 border rounded text-gray-800 bg-white focus:ring-2 focus:ring-purple-500 w-full">
						</div>
					</div>
				</div>
			`,
			focusConfirm: false,
			showCancelButton: true,
			confirmButtonText: 'บันทึก',
			cancelButtonText: 'ยกเลิก',
			preConfirm: () => {
				const msg = document.getElementById('swal-evt-msg').value.trim();
				const typeEl = document.querySelector('input[name="swal-time-type"]:checked');
				const type = typeEl ? typeEl.value : 'allday';
				const time = document.getElementById('swal-evt-time').value;

				if (!msg) { Swal.showValidationMessage('กรุณากรอกข้อความ'); return false; }
				if (type === 'specific' && !time) { Swal.showValidationMessage('กรุณาระบุเวลา'); return false; }

				return { msg, isAllDay: (type === 'allday'), time: (type === 'allday') ? '00:00' : time };
			}
		});

		if (formValues) {
			const newNoti = {
				id: 'custom_' + Date.now(),
				message: formValues.msg,
				date: dateStr,
				advanceDays: 0,
				isAllDay: formValues.isAllDay,
				time: formValues.time
			};

			state.customNotifications.push(newNoti);
			await dbPut(STORE_CONFIG, { key: 'custom_notifications_list', value: state.customNotifications });
			
			// Refresh หน้าจอ
			renderCalendarView();
			if(typeof renderCustomNotifyList === 'function') renderCustomNotifyList();
			
			Swal.fire({ icon: 'success', title: 'บันทึกเรียบร้อย', timer: 1000, showConfirmButton: false });
		}
	}



	function showDailyDetails(date) {
        // 1. ดึงรายการธุรกรรมจริง (Actual Transactions)
        const txsOnDay = state.transactions.filter(tx => 
            tx.date.slice(0, 10) === date
        );
        txsOnDay.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 2. คำนวณรายการประจำ (Recurring) ที่ตรงกับวันนี้
        const recurringOnDay = [];
        if (state.recurringRules && state.recurringRules.length > 0) {
            const targetDate = new Date(date);
            
            state.recurringRules.forEach(rule => {
                if (!rule.active) return;
                
                const ruleStartDate = new Date(rule.nextDueDate);
                // ถ้ารายการเริ่มหลังจากวันที่กดดู ก็ข้ามไป
                if (targetDate < ruleStartDate) return;

                let isMatch = false;
                
                // ตรวจสอบเงื่อนไขตามความถี่ (Frequency Logic)
                if (rule.frequency === 'daily') {
                    isMatch = true; 
                } else if (rule.frequency === 'weekly') {
                    // ตรงวันในสัปดาห์ (0-6)
                    isMatch = targetDate.getDay() === ruleStartDate.getDay();
                } else if (rule.frequency === 'monthly') {
                    // ตรงวันที่ (1-31)
                    isMatch = targetDate.getDate() === ruleStartDate.getDate();
                } else if (rule.frequency === 'yearly') {
                    // ตรงวันที่และเดือน
                    isMatch = targetDate.getDate() === ruleStartDate.getDate() && 
                              targetDate.getMonth() === ruleStartDate.getMonth();
                }

                if (isMatch) {
                    recurringOnDay.push(rule);
                }
            });
        }

        // --- สร้าง Header HTML (เพิ่มปุ่มแจ้งเตือนตรงนี้) ---
        let headerHtml = `
            <div class="flex justify-between items-center mb-4 w-full">
                <h3 class="text-xl font-bold text-gray-800">สรุปวันที่ ${new Date(date).toLocaleDateString('th-TH', {day: 'numeric', month: 'long', year: 'numeric'})}</h3>
            </div>
            
            <div class="flex gap-2 w-full mb-2">
                 <button id="cal-add-tx-btn" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-3 rounded-xl shadow-md transition duration-300 flex items-center justify-center gap-2 text-sm">
                    <i class="fa-solid fa-plus"></i> เพิ่มรายการ
                 </button>
                 
                 <button id="cal-add-notify-btn" class="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-3 rounded-xl shadow-md transition duration-300 flex items-center justify-center gap-2 text-sm">
                    <i class="fa-solid fa-bell"></i> แจ้งเตือน
                 </button>
            </div>
        `;

        let html = '<ul class="text-left space-y-3 mt-2 max-h-60 overflow-y-auto pr-2">';
        let totalIncome = 0;
        let totalExpense = 0;
        let totalTransfer = 0;
        
        // --- ส่วนแสดงรายการจริง ---
        if (txsOnDay.length === 0 && recurringOnDay.length === 0) {
             html += '<p class="text-center text-gray-500 mt-8 mb-8">ไม่มีรายการในวันนี้</p>';
        } else {
            // A. แสดงรายการที่บันทึกแล้ว
            txsOnDay.forEach(tx => {
                let txHtml = '';
                const receiptIconHtml = tx.receiptBase64 ? 
                    `<button type="button" class="view-receipt-btn text-purple-500 hover:text-purple-700 ml-2" data-base64="${tx.receiptBase64}">
                        <i class="fa-solid fa-receipt"></i>
                    </button>` : '';

                // ตรวจสอบว่าเป็นรายการล่วงหน้าหรือไม่
                const txDate = new Date(tx.date);
                const now = new Date();
                const isFuture = txDate > now; // ถ้ารายการ > เวลาปัจจุบัน คือรายการล่วงหน้า

                if (tx.type === 'income') {
                    totalIncome += tx.amount;
                    const account = state.accounts.find(a => a.id === tx.accountId);
                    
                    const nameText = isFuture ? `${escapeHTML(tx.name)} (รอรับ)` : escapeHTML(tx.name);
                    const nameColor = isFuture ? 'text-amber-700' : 'text-gray-800';
                    const amountColor = isFuture ? 'text-amber-600' : 'text-green-600';
                    const iconFuture = isFuture ? '<i class="fa-solid fa-clock mr-1 text-amber-500"></i>' : '';

                    txHtml = `
                        <div class="flex justify-between items-center ${isFuture ? 'opacity-90' : ''}">
                           <span class="font-medium ${nameColor}">${iconFuture}${nameText}${receiptIconHtml}</span>
                           <span class="font-bold ${amountColor} whitespace-nowrap ml-4">+${formatCurrency(tx.amount)}</span>
                        </div>
                        <div class="text-sm text-gray-500">${escapeHTML(tx.category)} (${escapeHTML(account ? account.name : 'N/A')})</div>
                    `;
                } else if (tx.type === 'expense') {
                    totalExpense += tx.amount;
                    const account = state.accounts.find(a => a.id === tx.accountId);

                    const nameText = isFuture ? `${escapeHTML(tx.name)} (รอจ่าย)` : escapeHTML(tx.name);
                    const nameColor = isFuture ? 'text-amber-700' : 'text-gray-800';
                    const amountColor = isFuture ? 'text-amber-600' : 'text-red-600';
                    const iconFuture = isFuture ? '<i class="fa-solid fa-clock mr-1 text-amber-500"></i>' : '';

                    txHtml = `
                        <div class="flex justify-between items-center ${isFuture ? 'opacity-90' : ''}">
                           <span class="font-medium ${nameColor}">${iconFuture}${nameText}${receiptIconHtml}</span>
                           <span class="font-bold ${amountColor} whitespace-nowrap ml-4">-${formatCurrency(tx.amount)}</span>
                        </div>
                        <div class="text-sm text-gray-500">${escapeHTML(tx.category)} (${escapeHTML(account ? account.name : 'N/A')})</div>
                    `;
                } else if (tx.type === 'transfer') {
                    totalTransfer += tx.amount;
                    const fromAccount = state.accounts.find(a => a.id === tx.accountId);
                    const toAccount = state.accounts.find(a => a.id === tx.toAccountId);
                    
                    const nameText = isFuture ? 'โอนย้าย (รอดำเนินการ)' : 'โอนย้าย';
                    const nameColor = isFuture ? 'text-amber-700' : 'text-blue-700';
                    const amountColor = isFuture ? 'text-amber-600' : 'text-blue-600';
                    const iconFuture = isFuture ? '<i class="fa-solid fa-clock mr-1 text-amber-500"></i>' : '';

                    txHtml = `
                        <div class="flex justify-between items-center ${isFuture ? 'opacity-90' : ''}">
                           <span class="font-medium ${nameColor}">${iconFuture}${nameText}${receiptIconHtml}</span>
                           <span class="font-bold ${amountColor} whitespace-nowrap ml-4">⇄${formatCurrency(tx.amount)}</span>
                        </div>
                        <div class="text-sm text-gray-500">
                            จาก: ${escapeHTML(fromAccount ? fromAccount.name : 'N/A')}<br>
                            ไป: ${escapeHTML(toAccount ? toAccount.name : 'N/A')}
                        </div>
                    `;
                }
                
                if (txHtml) {
                    const borderClass = isFuture ? 'border-dashed border-amber-300' : 'border-gray-200';
                    html += `<li class="border-b ${borderClass} pb-2">${txHtml}</li>`;
                }
            });

            // B. แสดงรายการ Recurring (รอจ่าย/รอรับ)
            if (recurringOnDay.length > 0) {
                if (txsOnDay.length > 0) {
                    html += `<li class="pt-2 text-xs font-bold text-gray-400 uppercase tracking-wider mt-2 border-t border-dashed border-gray-300">รายการประจำ (ประมาณการ)</li>`;
                }
                
                recurringOnDay.forEach(rule => {
                    let recHtml = '';
                    const amount = parseFloat(rule.amount);
                    const account = state.accounts.find(a => a.id === rule.accountId);
                    
                    if (rule.type === 'income') {
                        totalIncome += amount;
                        recHtml = `
                            <div class="flex justify-between items-center opacity-90">
                               <span class="font-medium text-amber-700 dark:text-amber-400"><i class="fa-solid fa-clock mr-1"></i>${escapeHTML(rule.name)} (รอรับ)</span>
                               <span class="font-bold text-amber-600 whitespace-nowrap ml-4">+${formatCurrency(amount)}</span>
                            </div>
                            <div class="text-sm text-gray-500 dark:text-gray-400 italic">${escapeHTML(rule.category)} (${escapeHTML(account ? account.name : 'N/A')})</div>
                        `;
                    } else if (rule.type === 'expense') {
                        totalExpense += amount;
                        recHtml = `
                            <div class="flex justify-between items-center opacity-90">
                               <span class="font-medium text-amber-700 dark:text-amber-400"><i class="fa-solid fa-clock mr-1"></i>${escapeHTML(rule.name)} (รอจ่าย)</span>
                               <span class="font-bold text-amber-600 whitespace-nowrap ml-4">-${formatCurrency(amount)}</span>
                            </div>
                            <div class="text-sm text-gray-500 dark:text-gray-400 italic">${escapeHTML(rule.category)} (${escapeHTML(account ? account.name : 'N/A')})</div>
                        `;
                    }

                    if (recHtml) {
                        html += `<li class="border-b border-gray-100 pb-2 mt-1 border-dashed border-amber-300 dark:border-amber-700">${recHtml}</li>`;
                    }
                });
            }
            
            html += '</ul>';
        }

        const netTotal = totalIncome - totalExpense;
        let netClass = 'text-gray-700';
        if (netTotal > 0) netClass = 'text-green-700';
        if (netTotal < 0) netClass = 'text-red-700';

        Swal.fire({
            title: '', 
            html: headerHtml + html, 
            footer: `
                <div class="grid grid-cols-4 gap-2 text-center text-lg">
                    <div>
                        <div class="text-sm font-semibold text-green-700">รายรับ</div>
                        <div class="font-bold text-green-600">${formatCurrency(totalIncome)}</div>
                    </div>
                    <div>
                        <div class="text-sm font-semibold text-red-700">รายจ่าย</div>
                        <div class="font-bold text-red-600">${formatCurrency(totalExpense)}</div>
                    </div>
                    <div>
                        <div class="text-sm font-semibold text-blue-700">โอนย้าย</div>
                        <div class="font-bold text-blue-600">${formatCurrency(totalTransfer)}</div>
                    </div>
                    <div>
                        <div class="text-sm font-semibold text-gray-800">คงเหลือ</div>
                        <div class="font-bold ${netClass}">${formatCurrency(netTotal)}</div>
                    </div>
                </div>
            `,
            width: 600,
            showConfirmButton: false, 
            showCloseButton: true,
            didOpen: () => {
                // Event ปุ่มเพิ่มรายการ (เดิม)
                const btnAdd = document.getElementById('cal-add-tx-btn');
                if(btnAdd) {
                    btnAdd.addEventListener('click', () => {
                        Swal.close(); 
                        openModal(null, null, date); 
                    });
                }
                
                // [ใหม่] Event ปุ่มเพิ่มการแจ้งเตือน
                // [ใน showDailyDetails] แก้ไข Event ปุ่มแจ้งเตือน
                const btnNotify = document.getElementById('cal-add-notify-btn');
                if(btnNotify) {
                    btnNotify.addEventListener('click', async () => {
                        Swal.close(); // ปิดหน้าต่างสรุปก่อน
                        
                        // เปิด Popup แบบ Form (มีช่องข้อความ และ ช่องจำนวนวัน)
                        const { value: formValues } = await Swal.fire({
                            title: 'สร้างการแจ้งเตือน',
                            html: `
                                <div class="text-left mb-1 text-sm font-semibold text-gray-600">ข้อความเตือน:</div>
                                <input id="swal-noti-text" class="swal2-input" placeholder="เช่น จ่ายค่าบัตรเครดิต" style="margin: 0 0 1.25em 0;">
                                
                                <div class="text-left mb-1 text-sm font-semibold text-gray-600">เตือนล่วงหน้า (วัน):</div>
                                <input id="swal-noti-days" type="number" class="swal2-input" value="0" min="0" placeholder="0 = เตือนวันนั้นเลย" style="margin: 0;">
                                <div class="text-xs text-gray-400 mt-1 text-left">* ใส่ 0 หากต้องการให้เตือนในวันที่ถึงกำหนด</div>
                            `,
                            showCancelButton: true,
                            confirmButtonText: 'บันทึก',
                            confirmButtonColor: '#f97316',
                            cancelButtonText: 'ยกเลิก',
                            focusConfirm: false,
                            preConfirm: () => {
                                return [
                                    document.getElementById('swal-noti-text').value,
                                    document.getElementById('swal-noti-days').value
                                ]
                            }
                        });

                        if (formValues) {
                            const [text, advanceDaysStr] = formValues;
                            if (!text) return; // ถ้าไม่ใส่ข้อความก็ไม่บันทึก

                            // เตรียมตัวแปร state
                            if (!state.customNotifications) state.customNotifications = [];
                            
                            const newNoti = {
                                id: 'custom_' + Date.now(),
                                message: text,
                                date: date,                // วันที่เป้าหมาย (จากปฏิทิน)
                                advanceDays: parseInt(advanceDaysStr) || 0, // วันที่เตือนล่วงหน้า
                                isRead: false
                            };
                            
                            state.customNotifications.push(newNoti);
                            
                            try {
                                // บันทึกลง DB
                                await dbPut(STORE_CONFIG, { key: 'custom_notifications_list', value: state.customNotifications });
                                
                                showToast('บันทึกการแจ้งเตือนเรียบร้อย', 'success');
                                
                                // [สำคัญ] อัปเดตรายการในหน้าตั้งค่าทันที
                                renderCustomNotificationsList(); 
                                
                            } catch (err) {
                                console.error('Save notification failed', err);
                                showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
                            }
                        }
                    });
                }
                
                // Event ปุ่มดูใบเสร็จ
                document.querySelectorAll('.view-receipt-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const base64 = e.currentTarget.dataset.base64;
                        if (base64) {
                            Swal.fire({
                                imageUrl: base64,
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
                });
            }
        });
    }



// ========================================
// ACCOUNTS PAGE RENDERING
// ========================================
	function renderAccountsPage() {
		// 1. Render Accounts List
		renderAccountSettingsList();

		// 2. Render Categories (Income)
		const incomeList = document.getElementById('list-income-cat');
		if (incomeList) {
			incomeList.innerHTML = '';
			if (state.categories.income.length > 0) {
				state.categories.income.forEach(cat => {
					const li = `
						<li class="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
							<span class="text-lg text-gray-700">${escapeHTML(cat)}</span>
							<button class="delete-cat-btn text-red-500 hover:text-red-700 p-3" data-type="income" data-name="${escapeHTML(cat)}">
								<i class="fa-solid fa-trash-alt"></i>
							</button>
						</li>`;
					 incomeList.insertAdjacentHTML('beforeend', li);
				});
			} else {
				incomeList.innerHTML = '<li class="text-gray-500 text-center p-2">ไม่มีหมวดหมู่รายรับ</li>';
			}
		}

		// 3. Render Categories (Expense)
		const expenseList = document.getElementById('list-expense-cat');
		if (expenseList) {
			expenseList.innerHTML = '';
			if (state.categories.expense.length > 0) {
				state.categories.expense.forEach(cat => {
					const li = `
						<li class="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
							<span class="text-lg text-gray-700">${escapeHTML(cat)}</span>
							<button class="delete-cat-btn text-red-500 hover:text-red-700 p-3" data-type="expense" data-name="${escapeHTML(cat)}">
								<i class="fa-solid fa-trash-alt"></i>
							</button>
						</li>`;
					 expenseList.insertAdjacentHTML('beforeend', li);
				});
			} else {
				expenseList.innerHTML = '<li class="text-gray-500 text-center p-2">ไม่มีหมวดหมู่รายจ่าย</li>';
			}
		}

		// 4. Render Frequent Items
		const frequentList = document.getElementById('list-frequent-item');
		const datalist = document.getElementById('frequent-items-datalist');
		if (frequentList && datalist) {
			frequentList.innerHTML = '';
			datalist.innerHTML = '';
			if (state.frequentItems.length > 0) {
				state.frequentItems.forEach(item => {
					const li = `
						<li class="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
							 <span class="text-lg text-gray-700">${escapeHTML(item)}</span>
							<button class="delete-item-btn text-red-500 hover:text-red-700 p-3" data-name="${escapeHTML(item)}">
								<i class="fa-solid fa-trash-alt"></i>
							 </button>
						</li>`;
					frequentList.insertAdjacentHTML('beforeend', li);
					datalist.insertAdjacentHTML('beforeend', `<option value="${escapeHTML(item)}"></option>`);
				});
			} else {
				frequentList.innerHTML = '<li class="text-gray-500 text-center p-2">ไม่มีรายการที่ใช้บ่อย</li>';
			}

			// Auto Complete Datalist
			if (state.autoCompleteList && state.autoCompleteList.length > 0) {
				 state.autoCompleteList.forEach(item => {
					 if (!state.frequentItems.includes(item.name)) {
						 datalist.insertAdjacentHTML('beforeend', `<option value="${escapeHTML(item.name)}"></option>`);
					 }
				});
			}
		}
		
		// 5. Render Recurring & Budget
		if (typeof renderRecurringSettings === 'function') renderRecurringSettings();
		populateBudgetCategoryDropdown();
		if (typeof renderBudgetSettingsList === 'function') renderBudgetSettingsList();

		applySettingsPreferences();
	}

    // ============================================
    // ฟังก์ชัน: renderSettings (ฉบับแก้ไข ล่าสุด)
    // หน้าที่: จัดการหน้าตั้งค่าทั่วไป (General Settings)
    // ส่วนจัดการบัญชี/หมวดหมู่ ย้ายไปที่ renderAccountsPage แล้ว
    // ============================================


// ========================================
// SETTINGS PAGE RENDERING
// ========================================
    async function renderSettings() {
        const getEl = (id) => document.getElementById(id);
        
        // 1. ตั้งค่า Slider ขนาดตัวอักษร
        const fontSlider = getEl('fontSizeSlider');
        if (fontSlider) {
            let savedIndex = localStorage.getItem('appFontIndex');
            if (savedIndex === null) savedIndex = 1;
            fontSlider.value = savedIndex;
            updateFontLabel(parseInt(savedIndex));
        }
        
        // 2. ตั้งค่า Toggle แสดงยอดเงินรวม
        const toggleBalanceBtn = getEl('toggle-show-balance');
        if (toggleBalanceBtn) {
            toggleBalanceBtn.checked = state.showBalanceCard;
        }

        // 3. ตั้งค่า Auto Lock
        const autoLockSelect = getEl('auto-lock-select');
        if (autoLockSelect) {
            autoLockSelect.value = state.autoLockTimeout.toString();
        }
        
        // 4. ตั้งค่า Dark Mode
        const toggleDarkModeBtn = getEl('toggle-dark-mode');
        if (toggleDarkModeBtn) {
            toggleDarkModeBtn.checked = state.isDarkMode;
        }

        // 5. ตั้งค่า Auto Confirm Password
        const toggleAutoConfirmBtn = getEl('toggle-auto-confirm-password');
        if (toggleAutoConfirmBtn) {
            toggleAutoConfirmBtn.checked = state.autoConfirmPassword;
        }

        // 6. อัปเดตสถานะปุ่ม Biometric (สแกนนิ้ว/ใบหน้า)
        const bioBtn = document.getElementById('btn-biometric-settings');
		const bioStatus = document.getElementById('bio-status-text');
		if (bioBtn) {
			if (state.biometricId) {
				bioBtn.textContent = 'เลิกใช้';
				bioBtn.classList.remove('bg-gray-200', 'text-gray-600');
				bioBtn.classList.add('bg-red-100', 'text-red-600');
				bioStatus.textContent = 'สถานะ: เปิดใช้งานแล้ว (บนอุปกรณ์นี้)';
				bioStatus.classList.add('text-green-600');
			} else {
				bioBtn.textContent = 'ตั้งค่า';
				bioBtn.classList.add('bg-gray-200', 'text-gray-600');
				bioBtn.classList.remove('bg-red-100', 'text-red-600');
				bioStatus.textContent = 'ใช้ลายนิ้วมือหรือใบหน้าแทนรหัสผ่าน (เฉพาะเครื่องนี้)';
				bioStatus.classList.remove('text-green-600');
			}
		}
			
		// 7. Line โหลดรายชื่อ ID จาก DB (เวอร์ชันใหม่: มีชื่อเล่น + รหัสผ่าน)
		const idListContainer = getEl('line-id-list');
		const inputId = getEl('input-line-user-id');
		const inputName = getEl('input-line-nickname'); // <--- เพิ่มตัวแปรรับชื่อ
		const btnAdd = getEl('btn-add-line-id');

		if (idListContainer && btnAdd) {
			let savedIds = [];
			try {
				const res = await dbGet(STORE_CONFIG, 'lineUserIds_List');
				if (res && Array.isArray(res.value)) {
					// Migration: ถ้าข้อมูลเก่าเป็น String ล้วน ให้แปลงเป็น Object
					savedIds = res.value.map(item => {
						if (typeof item === 'string') return { id: item, name: 'ไม่ระบุชื่อ' };
						return item;
					});
				}
			} catch(e) {}

			// ฟังก์ชันวาดรายการ
			const renderList = () => {
				idListContainer.innerHTML = '';
				if (savedIds.length === 0) {
					idListContainer.innerHTML = '<div class="text-sm text-gray-400 text-center py-2">ยังไม่มีผู้รับแจ้งเตือน</div>';
					return;
				}
				
				savedIds.forEach((item, index) => {
					const div = document.createElement('div');
					div.className = 'flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200 text-sm';
					
					// แสดงผลแบบ: ชื่อเล่น (ID ย่อ)
					const shortId = item.id.length > 10 ? '...' + item.id.substring(item.id.length - 6) : item.id;
					
					div.innerHTML = `
						<div class="flex flex-col">
							<span class="font-bold text-gray-700 text-xs">${item.name || 'ไม่ระบุชื่อ'}</span>
							<span class="text-gray-500 font-mono text-[10px]">${item.id}</span> </div>
						<button class="text-red-500 hover:text-red-700 delete-id-btn p-2" data-index="${index}">
							<i class="fa-solid fa-trash"></i>
						</button>
					`;
					idListContainer.appendChild(div);
				});

				// ผูกปุ่มลบ (เพิ่ม Password Prompt)
				document.querySelectorAll('.delete-id-btn').forEach(btn => {
					btn.addEventListener('click', async (e) => {
						const idx = e.currentTarget.dataset.index;
						const targetName = savedIds[idx].name;

						// 🔒 ถามรหัสผ่านก่อนลบ
						const hasAuth = await promptForPassword(`ยืนยันลบ: ${targetName}`);
						if (!hasAuth) return;

						savedIds.splice(idx, 1);
						await dbPut(STORE_CONFIG, { key: 'lineUserIds_List', value: savedIds });
						renderList();
						Swal.fire('ลบสำเร็จ', '', 'success');
					});
				});
			};

			renderList();

			// ฟังก์ชันปุ่มเพิ่ม (เพิ่ม Password Prompt)
			const newBtnAdd = btnAdd.cloneNode(true);
			btnAdd.parentNode.replaceChild(newBtnAdd, btnAdd);
			
			newBtnAdd.addEventListener('click', async () => {
				const valId = inputId.value.trim();
				const valName = inputName.value.trim(); // รับชื่อเล่น

				// ตรวจสอบความถูกต้อง
				if (!valId.startsWith('U') || valId.length < 30) {
					Swal.fire('ID ไม่ถูกต้อง', 'User ID ต้องขึ้นต้นด้วย U และยาว 33 ตัวอักษร', 'warning');
					return;
				}
				if (!valName) {
					Swal.fire('ระบุชื่อ', 'กรุณาใส่ชื่อเล่นให้ไอดีนี้ด้วยครับ', 'warning');
					return;
				}
				if (savedIds.some(i => i.id === valId)) {
					Swal.fire('ซ้ำ', 'ID นี้มีอยู่แล้ว', 'warning');
					return;
				}

				// 🔒 ถามรหัสผ่านก่อนเพิ่ม
				const hasAuth = await promptForPassword('ยืนยันรหัสผ่านเพื่อเพิ่มผู้รับแจ้งเตือน');
				if (!hasAuth) return;

				// บันทึกเป็น Object { id, name }
				savedIds.push({ id: valId, name: valName });
				await dbPut(STORE_CONFIG, { key: 'lineUserIds_List', value: savedIds });
				
				inputId.value = '';
				inputName.value = '';
				renderList();
				
				// ส่งข้อความต้อนรับ
				const GAS_URL = 'https://script.google.com/macros/s/AKfycbxPpU4YA-L6a5FH0dG6xb9u52gxxbuc5zBlWWkQg2DMDbMRwGNyCn-k4ISPPYRPtRw_/exec'; // <--- URL เดิมของคุณ
				fetch(GAS_URL, {
					method: 'POST', 
					mode: 'no-cors',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify({ 
						userIds: [valId], 
						message: `🎉 สวัสดีคุณ ${valName}!\nคุณถูกเพิ่มเข้าสู่ระบบแจ้งเตือน FMPro แล้ว ✅` 
					})
				});
				
				Swal.fire('สำเร็จ', `เพิ่มคุณ ${valName} เรียบร้อยแล้ว`, 'success');
			});
		}
        
        // หมายเหตุ: รายการบัญชี, หมวดหมู่, และรายการประจำ 
        // ถูกย้ายไปจัดการในฟังก์ชัน renderAccountsPage() แล้ว
        
        applySettingsPreferences();
    }
    


// ========================================
// ACCOUNT SETTINGS LIST
// ========================================
    function renderAccountSettingsList() {
        const listEl = document.getElementById('list-accounts');
        listEl.innerHTML = '';
        
        const allBalances = getAccountBalances(state.transactions);
        const sortedAccounts = getSortedAccounts();
        if (sortedAccounts.length === 0) {
            listEl.innerHTML = '<li class="text-gray-500 text-center p-2">ไม่มีบัญชี</li>';
            return;
        }
        
        sortedAccounts.forEach((acc, index) => { 
            const balance = allBalances[acc.id] || 0;
            let balanceClass = 'balance-zero';
            if (balance > 0) balanceClass = 'balance-positive';
            if (balance < 0) balanceClass = 'balance-negative';
            
            const currentIcon = acc.iconName || acc.icon || 'fa-wallet';
            
            const isFirst = (index === 0);
            const isLast = (index === sortedAccounts.length - 1);
            
            // [แก้ไข] ตรวจสอบค่า isVisible (ถ้าไม่มีให้ถือว่าเปิดอยู่)
            const isVisible = acc.isVisible !== false;

            const li = `
                <li class="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                    <div class="flex items-center gap-3">
                        <i class="fa-solid ${currentIcon} text-purple-600 text-xl"></i>
                        <div>
                            <span class="text-lg text-gray-700 font-medium">${escapeHTML(acc.name)}</span>
                            <span class="block text-sm text-gray-500 ${balanceClass} font-bold">ยอดปัจจุบัน: ${formatCurrency(balance)}</span>
                        </div>
                    </div>
                    <div class="flex-shrink-0 flex items-center gap-1">
                        <div class="mr-2 flex flex-col items-center justify-center">
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="sr-only peer" ${isVisible ? 'checked' : ''} onchange="toggleAccountVisibility('${acc.id}', this.checked)">
                                <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                            <span class="text-[10px] text-gray-400 mt-1">${isVisible ? 'แสดง' : 'ซ่อน'}</span>
                        </div>

                        <button class="edit-icon-btn text-purple-500 hover:text-purple-700 p-2" data-id="${acc.id}">
                            <i class="fa-solid fa-paintbrush"></i>
                        </button>
                        <button 
                            class="move-account-btn text-gray-500 hover:text-purple-600 p-2 ${isFirst ? 'opacity-20 cursor-not-allowed' : ''}" 
                            data-id="${acc.id}" data-direction="up" ${isFirst ? 'disabled' : ''}>
                            <i class="fa-solid fa-arrow-up"></i>
                        </button>
                        <button 
                            class="move-account-btn text-gray-500 hover:text-purple-600 p-2 ${isLast ? 'opacity-20 cursor-not-allowed' : ''}" 
                            data-id="${acc.id}" data-direction="down" ${isLast ? 'disabled' : ''}>
                            <i class="fa-solid fa-arrow-down"></i>
                        </button>
                        
                        <button class="edit-account-btn text-blue-500 hover:text-blue-700 p-2" data-id="${acc.id}">
                            <i class="fa-solid fa-pencil"></i>
                        </button>
                        <button class="delete-account-btn text-red-500 hover:text-red-700 p-2" data-id="${acc.id}">
                            <i class="fa-solid fa-trash-alt"></i>
                        </button>
                    </div>
                </li>
            `;
            listEl.insertAdjacentHTML('beforeend', li);
        });
    }
	
	// =======================================================
    // 1.7 [วางโค้ดตรงนี้ครับ] ฟังก์ชันแสดงรายการ Recurring
    // =======================================================



// ========================================
// RECURRING SETTINGS
// ========================================
    function renderRecurringSettings() {
        const listEl = document.getElementById('list-recurring-rules');
        if (!listEl) return;
        listEl.innerHTML = '';

        const rules = state.recurringRules || [];

        if (rules.length === 0) {
            listEl.innerHTML = '<li class="text-gray-500 text-center p-2">ไม่มีรายการประจำ</li>';
            return;
        }

        rules.forEach(rule => {
            const freqMap = { 'daily': 'ทุกวัน', 'weekly': 'ทุกสัปดาห์', 'monthly': 'ทุกเดือน', 'yearly': 'ทุกปี' };
            const typeClass = rule.type === 'income' ? 'text-green-600' : 'text-red-600';
            const amount = parseFloat(rule.amount); 
            
            // [แก้ไข] ตรงปุ่ม edit-rec-btn เปลี่ยน onclick เป็น editRecurringRuleWithAuth
            const li = `
                <li class="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <div>
                        <div class="font-bold text-gray-800">${escapeHTML(rule.name)}</div>
                        <div class="text-sm text-gray-500">
                            <span class="${typeClass}">${formatCurrency(amount)}</span> | 
                            ${freqMap[rule.frequency]} | ครั้งถัดไป: ${new Date(rule.nextDueDate).toLocaleDateString('th-TH')}
                        </div>
                    </div>
                    <div class="flex gap-2">
                         <button class="edit-rec-btn text-blue-500 hover:text-blue-700 p-2" onclick="editRecurringRuleWithAuth('${rule.id}')">
                            <i class="fa-solid fa-pencil"></i>
                        </button>
                        <button class="delete-rec-btn text-red-500 hover:text-red-700 p-2" onclick="deleteRecurringRule('${rule.id}')">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </li>
            `;
            listEl.insertAdjacentHTML('beforeend', li);
        });
    }
	
	// [เพิ่มใหม่] ฟังก์ชันสำหรับเช็ครหัสผ่านก่อนแก้ไข Recurring
    window.editRecurringRuleWithAuth = async (id) => {
        const hasPermission = await promptForPassword('ป้อนรหัสผ่านเพื่อแก้ไขรายการประจำ');
        if (hasPermission) {
            window.openRecurringModal(id);
        }
    };

    // [แก้ไข] เพิ่มการเช็ครหัสผ่านก่อนลบ Recurring
    window.deleteRecurringRule = async (id) => {
        // +++ เพิ่มส่วนนี้ +++
        const hasPermission = await promptForPassword('ป้อนรหัสผ่านเพื่อลบรายการประจำ');
        if (!hasPermission) return;
        // ++++++++++++++++++

        const result = await Swal.fire({
            title: 'ลบรายการประจำ?',
            text: "รายการนี้จะไม่ถูกสร้างอัตโนมัติอีกต่อไป",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'ลบเลย',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                await dbDelete(STORE_RECURRING, id);
                state.recurringRules = state.recurringRules.filter(r => r.id !== id);
                renderRecurringSettings();
                Swal.fire('ลบแล้ว', '', 'success');
            } catch (err) {
                console.error(err);
                Swal.fire('Error', 'ลบไม่สำเร็จ', 'error');
            }
        }
    }

    


// ========================================
// PAGINATION CONTROLS
// ========================================
    function renderPaginationControls(source, totalPages, currentPage) {
        const controlsEl = document.getElementById(source === 'home' ? 'home-pagination-controls' : 'list-pagination-controls');
        controlsEl.innerHTML = '';

        if (totalPages <= 1) {
            return;
        }

        let html = '';
        const prevDisabled = currentPage === 1;
        html += `<button class="px-4 py-2 rounded-lg font-medium border border-gray-300 shadow-sm ${prevDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-purple-100 text-purple-600'}" 
                    data-page="${currentPage - 1}" ${prevDisabled ? 'disabled' : ''}>
                    <i class="fa-solid fa-chevron-left"></i>
                </button>`;
        html += `<span class="px-4 py-2 text-sm text-gray-700">
                    หน้า ${currentPage} / ${totalPages}
                </span>`;
        const nextDisabled = currentPage === totalPages;
        html += `<button class="px-4 py-2 rounded-lg font-medium border border-gray-300 shadow-sm ${nextDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-purple-100 text-purple-600'}" 
                    data-page="${currentPage + 1}" ${nextDisabled ? 'disabled' : ''}>
                    <i class="fa-solid fa-chevron-right"></i>
                </button>`;
        controlsEl.innerHTML = html;
    }

    function toggleCalculator(e, inputId, popoverId, previewId, displayId) {
		e.stopPropagation(); // ป้องกัน Event Bubbling
		const popover = document.getElementById(popoverId);
		const input = document.getElementById(inputId);
		const previewEl = document.getElementById(previewId);
		const displayEl = document.getElementById(displayId);

		if (popover.classList.contains('hidden')) {
			// เปิดเครื่องคิดเลข
			popover.classList.remove('hidden');
			
			// ดึงค่าปัจจุบันมาแสดงทันที
			if (input && previewEl) {
				previewEl.textContent = input.value || '0';
			}
			if (displayEl) displayEl.textContent = ''; // ล้างผลลัพธ์เก่า
		} else {
			// ปิดเครื่องคิดเลข
			popover.classList.add('hidden');
		}
	}

	// --- เพิ่มฟังก์ชันนี้: สำหรับบีบอัดรูปภาพ ---
    function compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    // สร้าง Canvas
                    const elem = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // คำนวณขนาดใหม่ (Maintain Aspect Ratio)
                    if (width > height) {
                        if (width > COMPRESS_MAX_WIDTH) {
                            height *= COMPRESS_MAX_WIDTH / width;
                            width = COMPRESS_MAX_WIDTH;
                        }
                    } else {
                        if (height > COMPRESS_MAX_WIDTH) {
                            width *= COMPRESS_MAX_WIDTH / height;
                            height = COMPRESS_MAX_WIDTH;
                        }
                    }

                    elem.width = width;
                    elem.height = height;

                    const ctx = elem.getContext('2d');
                    // วาดรูปลง Canvas ตามขนาดใหม่
                    ctx.drawImage(img, 0, 0, width, height);

                    // แปลงกลับเป็น Base64 แบบ JPEG พร้อมลด Quality
                    // ข้อมูล: toDataURL('image/jpeg', quality)
                    const data = elem.toDataURL('image/jpeg', COMPRESS_QUALITY);
                    resolve(data);
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    }
	
	// [script.js] ฟังก์ชันแกะข้อมูล (V.6: รองรับสลิป KBank และปี พ.ศ. ย่อแบบสมบูรณ์)
	function extractSlipData(text) {
		console.log("Raw OCR Text:", text);

		// 1. ล้างข้อมูลพื้นฐาน
		// ลบตัวอักษรขยะ | หรือ l ที่มักโผล่มาหน้าวันที่ (เกิดจากเส้นขอบสลิป)
		let cleanText = text.replace(/,/g, '').replace(/^[|lI]\s*/gm, ''); 
		
		const lines = cleanText.split(/\r\n|\n|\r/).map(line => line.trim()).filter(line => line.length > 0);

		let result = {
			amount: null,
			receiver: null,
			memo: null,
			date: null
		};

		// --- ฐานข้อมูลเดือน (รวมคำผิด OCR ที่พบบ่อยใน KBank) ---
		const monthMap = {
			// ภาษาไทยปกติ
			'ม.ค.': '01', 'มค': '01', 'มกราคม': '01',
			'ก.พ.': '02', 'กพ': '02', 'กุมภาพันธ์': '02',
			'มี.ค.': '03', 'มีค': '03', 'มีนาคม': '03',
			'เม.ย.': '04', 'เมย': '04', 'เมษายน': '04',
			'พ.ค.': '05', 'พค': '05', 'พฤษภาคม': '05',
			'มิ.ย.': '06', 'มิย': '06', 'มิถุนายน': '06',
			'ก.ค.': '07', 'กค': '07', 'กรกฎาคม': '07',
			'ส.ค.': '08', 'สค': '08', 'สิงหาคม': '08',
			'ก.ย.': '09', 'กย': '09', 'กันยายน': '09',
			'ต.ค.': '10', 'ตค': '10', 'ตุลาคม': '10',
			'พ.ย.': '11', 'พย': '11', 'พฤศจิกายน': '11',
			'ธ.ค.': '12', 'ธค': '12', 'ธันวาคม': '12',
			// ภาษาอังกฤษ
			'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
			'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
			// *** คำผิด OCR ยอดฮิต (KBank) ***
			'u.ค.': '01', 'u.a.': '01', 'H.A.': '01', // ม.ค. อ่านเป็น u.ค.
			'n.w.': '02', 'n.W.': '02', // ก.พ. อ่านเป็น n.w.
			'n.a.': '09', 'n.u.': '09', // ก.ย.
		};

		// ฟังก์ชันช่วยแปลงปี (รองรับทั้ง 2 หลักและ 4 หลัก)
		const normalizeYear = (yStr) => {
			let y = parseInt(yStr);
			if (y > 2400) return y - 543; // พ.ศ. เต็ม (2569 -> 2026)
			if (y > 2000) return y;       // ค.ศ. เต็ม (2026 -> 2026)
			// กรณีปี 2 หลัก
			if (y > 40) return (y + 2500) - 543; // เดาว่าเป็น พ.ศ. (69 -> 2569 -> 2026)
			return 2000 + y;                     // เดาว่าเป็น ค.ศ. (26 -> 2026)
		};

		// --- STEP 1: หา "วันที่และเวลา" (Date & Time) ---
		
		// สูตร KBank (แบบบรรทัดเดียว): "15 ม.ค. 69 00:21 น."
		// Regex จับ: (วัน) (เดือน) (ปี) (ชม):(นาที)
		const kbankRegex = /(\d{1,2})\s*([ก-๙a-zA-Z.]{2,10})\.?\s*(\d{2,4})\s+(\d{1,2})[:.](\d{2})/;

		for (const line of lines) {
			// 1.1 ลองสูตร KBank ก่อน (แม่นยำสุด)
			let match = line.match(kbankRegex);
			if (match) {
				let d = match[1].padStart(2, '0');
				let mStr = match[2].replace(/\./g, '') + (match[2].includes('.') ? '.' : ''); // คงจุดไว้ถ้ามี หรือลองแบบไม่มีจุด
				let yStr = match[3];
				let h = match[4].padStart(2, '0');
				let mn = match[5].padStart(2, '0');

				// หาเดือนใน Map
				let month = '01'; // Default
				// ลองหาแบบตรงๆ หรือแบบลบจุด
				let cleanMStr = mStr.replace(/\./g, '');
				// วนลูปหา key ที่แมตช์ (เผื่อกรณี u.ค. หรือ ม.ค.)
				let foundKey = Object.keys(monthMap).find(k => k.replace(/\./g, '') === cleanMStr || k === mStr);
				
				if (foundKey) {
					month = monthMap[foundKey];
					let year = normalizeYear(yStr);
					result.date = `${year}-${month}-${d}T${h}:${mn}`;
					console.log("KBank Date Found:", result.date);
					break; 
				}
			}
		}

		// 1.2 ถ้าสูตร KBank ไม่เจอ ให้ใช้สูตร "แยกหา" (V.5 เดิม)
		if (!result.date) {
			let foundDay, foundMonth, foundYear, foundHour, foundMinute;

			// หาเวลา
			for (const line of lines) {
				const timeRegex = /(?:เวลา|Time)?\s*([0-2]?\d)[:.;]([0-5]\d)(?!\d)/i; 
				const match = line.match(timeRegex);
				// ต้องไม่ใช่บรรทัดที่มีคำว่า "จำนวน" หรือ "Amount" (กันสับสนกับยอดเงิน)
				if (match && !/(?:จำนวน|Amount|Total|Baht|บาท)/i.test(line)) {
					foundHour = match[1].padStart(2, '0');
					foundMinute = match[2].padStart(2, '0');
					break;
				}
			}

			// หาวันที่
			for (const line of lines) {
				if (foundDay && foundMonth && foundYear) break;
				// วันที่แบบตัวอักษร (15 ม.ค. 69)
				const textDateRegex = /(\d{1,2})\s*([ก-๙a-zA-Z.]{2,10})\.?\s*(\d{2,4})/;
				let match = line.match(textDateRegex);
				if (match) {
					let d = match[1];
					let mStr = match[2].replace(/\./g, '');
					let y = match[3];
					let mKey = Object.keys(monthMap).find(k => k.replace(/\./g, '') === mStr);
					if (mKey) {
						foundDay = d.padStart(2, '0');
						foundMonth = monthMap[mKey];
						foundYear = y;
						break;
					}
				}
				// วันที่แบบตัวเลข (15/01/69)
				const numDateRegex = /(\d{1,2})\s*[\/\-]\s*(\d{1,2})\s*[\/\-]\s*(\d{2,4})/;
				match = line.match(numDateRegex);
				if (match) {
					foundDay = match[1].padStart(2, '0');
					foundMonth = match[2].padStart(2, '0');
					foundYear = match[3];
					break;
				}
			}

			if (foundDay && foundMonth && foundYear) {
				let year = normalizeYear(foundYear);
				let hh = foundHour || '00';
				let mm = foundMinute || '00';
				result.date = `${year}-${foundMonth}-${foundDay}T${hh}:${mm}`;
			}
		}

		// --- STEP 2: หาจำนวนเงิน (Amount) ---
		// (Logic เดิม V.5)
		if (!result.amount) {
			// วนลูปหาบรรทัดที่มี Keyword ชัดเจนก่อน
			for (const line of lines) {
				if (/(?:จำนวน|Amount|Total|ยอดเงิน|ยอดโอน|โอน)/i.test(line) && !/(?:คงเหลือ|Balance|Available)/i.test(line)) {
					let match = line.match(/(\d+\.\d{2})/);
					if (match) {
						result.amount = parseFloat(match[1]);
						break;
					} else {
						// ดูบรรทัดถัดไป (เผื่อตัวเลขหลุดลงมา)
						let idx = lines.indexOf(line);
						if (idx !== -1 && idx + 1 < lines.length) {
							let nextLine = lines[idx+1];
							let nextMatch = nextLine.match(/(\d+\.\d{2})/);
							if (nextMatch && !/(?:Fee|ค่าธรรมเนียม)/i.test(nextLine)) {
								result.amount = parseFloat(nextMatch[1]);
								break;
							}
						}
					}
				}
			}
			// Fallback: กวาดหาตัวเลขทศนิยมที่มากที่สุด
			if (!result.amount) {
				const candidates = [];
				for (const line of lines) {
					if (/(?:คงเหลือ|Balance|Fee|Date|วันที่|เวลา)/i.test(line)) continue;
					const matches = line.match(/([\d,]+\.\d{2})/g);
					if (matches) {
						matches.forEach(m => {
							let val = parseFloat(m.replace(/,/g, ''));
							if (val > 0) candidates.push(val);
						});
					}
				}
				if (candidates.length > 0) result.amount = Math.max(...candidates);
			}
		}

		// --- STEP 3: หาชื่อผู้รับ & Memo ---
		// (Logic เดิม V.5)
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			
			// Receiver
			if (!result.receiver && /(?:ไปยัง|To|Account Name|ชื่อบัญชี|ผู้รับโอน|ปลายทาง)/i.test(line)) {
				let cleanLine = line.replace(/(?:ไปยัง|To|Account Name|ชื่อบัญชี|ผู้รับโอน|ปลายทาง|[:.]|นาย|นาง|น\.ส\.)/ig, '').trim();
				if (cleanLine.length > 1) result.receiver = cleanLine;
				else if (i + 1 < lines.length) {
					let nextLine = lines[i+1];
					if (!/(?:Bank|ธนาคาร|เลขที่|Account No|\d{3,})/i.test(nextLine)) result.receiver = nextLine;
				}
			}

			// Memo
			if (!result.memo && /(?:บันทึก|ช่วยจำ|Note|Memo|ข้อความ)/i.test(line)) {
				result.memo = line; 
				let checkEmpty = line.replace(/(?:บันทึกช่วยจำ|บันทึก|ช่วยจำ|Note|Memo|ข้อความ)/ig, '').trim();
				if (checkEmpty.length < 2 && i + 1 < lines.length) {
					result.memo = lines[i+1];
				}
			}
		}

		// --- STEP 4: Final Cleanup Memo ---
		if (result.memo) {
			let clean = result.memo;
			const keywordsToRemove = ['บันทึกช่วยจำ', 'บันทึก', 'ช่วยจำ', 'ชวยจำ', 'ข่วยจำ', 'ความจำ', 'Note', 'Memo', 'Remark', 'Message', 'Ref.2', 'Ref2', 'ข้อความ', 'รายการ'];
			keywordsToRemove.forEach(kw => {
				const pattern = kw.split('').join('\\s*'); 
				const regex = new RegExp(pattern, 'gi'); 
				clean = clean.replace(regex, '');
			});
			clean = clean.replace(/^[\s:.\-_]+/, '');
			result.memo = clean.trim();
		}

		return result;
	}
	
    // [script.js] ฟังก์ชัน handleReceiptFileChange (เพิ่มส่วนเติมวันที่)
	async function handleReceiptFileChange(e) {
		const file = e.target.files[0];
		const getEl = (id) => document.getElementById(id);
		
		clearReceiptFile(true); 
		
		if (!file) return;
		if (!file.type.startsWith('image/')) {
			Swal.fire('ข้อผิดพลาด', 'กรุณาเลือกไฟล์รูปภาพเท่านั้น', 'error');
			e.target.value = null;
			return;
		}
		if (typeof MAX_FILE_SIZE_MB !== 'undefined' && file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
			Swal.fire('ขนาดใหญ่เกินไป', `ไฟล์ต้นฉบับต้องไม่เกิน ${MAX_FILE_SIZE_MB} MB`, 'error');
			e.target.value = null; 
			return;
		}

		try {
			let timerInterval;
			Swal.fire({
				title: 'กำลังสแกนสลิป...',
				html: 'ระบบกำลังอ่าน <b>วันที่, เวลา, ยอดเงิน</b><br>จากรูปภาพด้วย AI (OCR)',
				timerProgressBar: true,
				allowOutsideClick: false,
				didOpen: () => {
					Swal.showLoading();
				}
			});

			let ocrData = { amount: null, receiver: null, memo: null, date: null };
			try {
				const worker = await Tesseract.createWorker('tha+eng');
				const ret = await worker.recognize(file);
				ocrData = extractSlipData(ret.data.text);
				await worker.terminate();
			} catch (ocrErr) {
				console.error("OCR System Error:", ocrErr);
			}

			const compressedBase64 = await compressImage(file);
			
			currentReceiptBase64 = compressedBase64;
			getEl('receipt-preview').src = currentReceiptBase64;
			getEl('receipt-preview-container').classList.remove('hidden');
			getEl('clear-receipt-btn').classList.remove('hidden');
			
			let msgParts = ['แนบรูปภาพสำเร็จ'];
			let hasOcrData = false;
			
			// 1. เติมยอดเงิน
			if (ocrData.amount) {
				getEl('tx-amount').value = ocrData.amount;
				getEl('tx-amount').dispatchEvent(new Event('keyup'));
				msgParts.push(`💰 ยอดเงิน: <b>${ocrData.amount}</b>`);
				hasOcrData = true;
			}

			// 2. เติมวันที่และเวลา (NEW!)
			if (ocrData.date) {
				getEl('tx-date').value = ocrData.date;
				msgParts.push(`📅 วันที่: <b>${new Date(ocrData.date).toLocaleString('th-TH')}</b>`);
				hasOcrData = true;
			}

			// 3. เติมคำอธิบาย
			let newDescParts = [];
			if (ocrData.memo) newDescParts.push(ocrData.memo); 
			if (ocrData.receiver) newDescParts.push(`โอนให้: ${ocrData.receiver}`);

			if (newDescParts.length > 0) {
				const currentDesc = getEl('tx-desc').value;
				const newDescText = newDescParts.join(' | ');
				getEl('tx-desc').value = currentDesc ? `${currentDesc} (${newDescText})` : newDescText;
				msgParts.push(`📝 ข้อมูล: <b>${newDescText}</b>`);
				hasOcrData = true;
			}

			Swal.fire({
				icon: 'success',
				title: hasOcrData ? 'สแกนเรียบร้อย!' : 'อัปโหลดสำเร็จ',
				html: msgParts.join('<br>'),
				timer: 2500,
				showConfirmButton: false
			});

		} catch (error) {
			console.error("Error processing receipt file:", error);
			Swal.fire('ข้อผิดพลาด', 'ไม่สามารถประมวลผลไฟล์รูปภาพได้', 'error');
			e.target.value = null;
		}
	}

    function clearReceiptFile(onlyState = false) {
        const getEl = (id) => document.getElementById(id);
        currentReceiptBase64 = null;
        getEl('receipt-preview').src = '';
        getEl('receipt-preview-container').classList.add('hidden');
        getEl('clear-receipt-btn').classList.add('hidden');
        
        if (!onlyState) {
            getEl('tx-receipt-file').value = null; 
        }
    }



// ========================================
// TRANSACTION MODAL
// ========================================
    function openModal(txId = null, defaultAccountId = null, defaultDate = null) {
        const form = document.getElementById('transaction-form');
        form.reset();
		const recCheck = document.getElementById('tx-is-recurring');
		const recOpt = document.getElementById('tx-recurring-options');
		if(recCheck) recCheck.checked = false;
		if(recOpt) recOpt.classList.add('hidden');
        document.getElementById('calc-preview').textContent = '';
        document.getElementById('calculator-popover').classList.add('hidden');
        document.getElementById('auto-fill-hint').classList.add('hidden'); 
        
        document.getElementById('account-calculator-popover').classList.add('hidden');
        document.getElementById('edit-account-calculator-popover').classList.add('hidden');
        
        clearReceiptFile(); 
        
        const getEl = (id) => document.getElementById(id);
        
        populateAccountDropdowns('tx-account');
        populateAccountDropdowns('tx-account-from', acc => acc.type === 'cash'); 
        populateAccountDropdowns('tx-account-to');

        const toggleFavBtn = getEl('toggle-favorite-btn'); 

        const setFavoriteState = (isFav) => { 
            toggleFavBtn.classList.toggle('text-yellow-500', isFav);
            toggleFavBtn.classList.toggle('text-gray-400', !isFav);
        };

        if (txId) {
            const tx = state.transactions.find(t => t.id === txId);
            if (!tx) return;
            
            getEl('modal-title').textContent = 'แก้ไขรายการ';
            getEl('tx-id').value = tx.id;
            document.querySelector(`input[name="tx-type"][value="${tx.type}"]`).checked = true;
            getEl('tx-amount').value = tx.amount;
            getEl('tx-date').value = tx.date.slice(0, 16);
            getEl('tx-desc').value = tx.desc;
            getEl('tx-name').value = tx.name; 
            
            if (tx.receiptBase64) {
                currentReceiptBase64 = tx.receiptBase64;
                getEl('receipt-preview').src = currentReceiptBase64;
                getEl('receipt-preview-container').classList.remove('hidden');
                getEl('clear-receipt-btn').classList.remove('hidden');
            }

            if(tx.type === 'transfer') {
                getEl('tx-account-from').value = tx.accountId;
                getEl('tx-account-to').value = tx.toAccountId;
            } else {
                updateCategoryDropdown(tx.type); 
                getEl('tx-category').value = tx.category; 
                getEl('tx-account').value = tx.accountId;
            }
            
            const isFav = state.frequentItems.includes(tx.name);
            setFavoriteState(isFav);
            
        } else {
            getEl('modal-title').textContent = 'เพิ่มรายการใหม่';
            getEl('tx-id').value = '';
            getEl('tx-name').value = ''; 
            document.getElementById('tx-type-expense').checked = true;
            updateCategoryDropdown('expense');
            
            setFavoriteState(false); 

            const now = new Date();
            
            if (defaultDate) {
                const hh = now.getHours().toString().padStart(2, '0');
                const min = now.getMinutes().toString().padStart(2, '0');
                getEl('tx-date').value = `${defaultDate}T${hh}:${min}`;
            } else {
                const yyyy = now.getFullYear();
                const mm = (now.getMonth() + 1).toString().padStart(2, '0');
                const dd = now.getDate().toString().padStart(2, '0');
                const hh = now.getHours().toString().padStart(2, '0');
                const min = now.getMinutes().toString().padStart(2, '0');
                getEl('tx-date').value = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
            }

            getEl('tx-amount').value = '';
            
            if(defaultAccountId){
                 const acc = state.accounts.find(a => a.id === defaultAccountId);
                if(acc){
                     if(acc.type === 'credit' || acc.type === 'liability'){
                         document.getElementById('tx-type-expense').checked = true;
                        updateCategoryDropdown('expense');
                     }
                     getEl('tx-account').value = defaultAccountId;
                }
            }
        }
        
        updateFormVisibility();
        getEl('form-modal').classList.remove('hidden');
    }

    function closeModal() {
        document.getElementById('form-modal').classList.add('hidden');
        document.getElementById('transaction-form').reset();
        document.getElementById('calc-preview').textContent = ''; 
        document.getElementById('calculator-popover').classList.add('hidden');
        clearReceiptFile();
		// ล้างค่า Draft ID ทิ้งเมื่อปิดหน้าต่าง
		const hiddenDraftInput = document.getElementById('hidden-draft-id');
		if(hiddenDraftInput) hiddenDraftInput.value = '';
    }

    function openAccountModal(accountId = null, closeOnly = false) {
        const modal = document.getElementById('account-form-modal');
        if (closeOnly) {
            modal.classList.add('hidden');
            document.getElementById('edit-account-calculator-popover').classList.add('hidden');
            return;
        }
        
        document.getElementById('account-calculator-popover').classList.add('hidden');

        const form = document.getElementById('account-form');
        form.reset();
        const getEl = (id) => document.getElementById(id);
        
        const acc = state.accounts.find(a => a.id === accountId);
        if (!acc) {
            Swal.fire('ข้อผิดพลาด', 'ไม่พบบัญชีที่ต้องการแก้ไข', 'error');
            return;
        }
        
        getEl('account-modal-title').textContent = 'แก้ไขบัญชี';
        getEl('edit-account-id').value = acc.id;
        getEl('edit-account-name').value = acc.name;
        getEl('edit-account-type').value = acc.type;
        getEl('edit-account-balance').value = acc.initialBalance;
        getEl('edit-acc-calc-preview').textContent = ''; 
        getEl('edit-account-calculator-popover').classList.add('hidden');
		
		// [NEW] ส่วนที่เพิ่ม: ดึงยอดเงินปัจจุบันมาโชว์ และรีเซ็ตฟอร์มปรับปรุงยอด
        const currentBal = getAccountBalances(state.transactions)[acc.id] || 0;
        const balDisplay = document.getElementById('modal-current-balance-display');
        if (balDisplay) {
            balDisplay.innerText = formatCurrency(currentBal);
            // ถ้าเงินติดลบให้เป็นสีแดง
            balDisplay.className = `font-bold text-xl ${currentBal >= 0 ? 'text-blue-600' : 'text-red-600'}`;
        }
        
        // รีเซ็ตค่าในช่องกรอกให้ว่างเปล่า
        if (document.getElementById('adjust-tx-amount')) {
            document.getElementById('adjust-tx-amount').value = '';
            document.getElementById('adjust-tx-desc').value = '';
            document.getElementById('adjust-tx-type').value = 'income';
            
            // รีเซ็ตสีปุ่มให้กลับมาเป็นค่าเริ่มต้น (ปุ่มเพิ่มสีเขียว)
            const btnInc = document.getElementById('btn-adj-type-inc');
            const btnExp = document.getElementById('btn-adj-type-exp');
            
            if (btnInc && btnExp) {
                btnInc.className = 'flex-1 py-2 px-3 rounded-lg border bg-green-500 text-white border-green-600 shadow-sm transition-all text-sm font-bold';
                btnExp.className = 'flex-1 py-2 px-3 rounded-lg border bg-white text-gray-600 border-gray-300 shadow-sm transition-all text-sm hover:bg-gray-50';
            }
        }

        modal.classList.remove('hidden');
    }
    
    function closeIconModal() {
        document.getElementById('icon-form-modal').classList.add('hidden');
    }



// ========================================
// ICON SELECTION
// ========================================
    function renderIconChoices(filterText = '') {
        const container = document.getElementById('icon-list-container');
        container.innerHTML = '';
        const filteredIcons = ICON_CHOICES.filter(icon => icon.includes(filterText.toLowerCase()));

        if (filteredIcons.length === 0) {
            container.innerHTML = '<p class="col-span-6 sm:col-span-8 text-center text-gray-500 p-4">ไม่พบไอคอนที่ตรงกับคำค้นหา</p>';
            return;
        }

        filteredIcons.forEach(iconClass => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'icon-select-btn p-3 rounded-xl hover:bg-purple-100 transition duration-150';
            button.setAttribute('data-icon', iconClass);
            button.innerHTML = `<i class="fa-solid ${iconClass} text-2xl text-purple-600"></i>`;
            container.appendChild(button);
        });
    }

    async function openIconModal(accountId) {
        const modal = document.getElementById('icon-form-modal');
        const acc = state.accounts.find(a => a.id === accountId);
        if (!acc) return;

        const getEl = (id) => document.getElementById(id);
        const currentIcon = acc.iconName || acc.icon || 'fa-wallet';

        getEl('edit-icon-account-id').value = accountId;
        getEl('icon-acc-name').textContent = escapeHTML(acc.name);
        getEl('icon-preview').className = `fa-solid ${currentIcon} text-purple-600 text-2xl ml-2`;
        getEl('icon-preview').setAttribute('data-current-icon', currentIcon);
        getEl('icon-search').value = '';
        
        renderIconChoices();

        modal.classList.remove('hidden');
    }
    
    function closeAccountDetailModal() {
        document.getElementById('account-detail-modal').classList.add('hidden');
    }
    


// ========================================
// ACCOUNT DETAIL MODAL
// ========================================
    async function showAccountDetailModal(accountId) {
        const modal = document.getElementById('account-detail-modal');
        modal.classList.remove('hidden');
        document.getElementById('account-detail-modal-body').innerHTML = '<tr><td colspan="5" class="p-6 text-center text-gray-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i> กำลังโหลดรายการ...</td></tr>';
        
        accountDetailState.accountId = accountId;
        accountDetailState.viewMode = state.homeViewMode; 
        accountDetailState.currentDate = state.homeCurrentDate; 
        updateAccountDetailControls();

        const btn = document.getElementById('add-tx-from-account-btn');
        if(btn) btn.dataset.accountId = accountId;

        await renderAccountDetailList(accountId);
    }
    
    // ********** MODIFIED: renderAccountDetailList (with Edit/Delete buttons) **********
    async function renderAccountDetailList(accountId) {
        const modalTitle = document.getElementById('account-detail-modal-title');
        const listBody = document.getElementById('account-detail-modal-body');
        const accDetailInitialBalance = document.getElementById('acc-detail-initial-balance');
        const accDetailCurrentBalance = document.getElementById('acc-detail-current-balance');
        
        const { viewMode, currentDate } = accountDetailState;
        let relevantTxs = state.transactions.filter(tx => {
             const isRelated = tx.accountId === accountId || tx.toAccountId === accountId;
             if (!isRelated) return false;
             if (viewMode === 'all') return true;
             const txDate = new Date(tx.date);
             const year = currentDate.slice(0, 4);
             if (viewMode === 'year') {
                 return txDate.getFullYear() == year;
             } else if (viewMode === 'month') {
                 const month = currentDate.slice(5, 7);
                 return txDate.getFullYear() == year && (txDate.getMonth() + 1).toString().padStart(2, '0') == month;
             }
             return true;
        });

        listBody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-gray-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i> กำลังโหลดรายการ...</td></tr>';

        const account = state.accounts.find(a => a.id === accountId);
        if (!account) {
            listBody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-red-500">ไม่พบบัญชี</td></tr>';
            return;
        }
        
        modalTitle.textContent = `${escapeHTML(account.name)}`;
        accDetailInitialBalance.textContent = formatCurrency(account.initialBalance || 0);

        const allTxs = [...state.transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
        let currentBalance = account.initialBalance || 0;
        const now = new Date(); 

        for (const tx of allTxs) {
            if (new Date(tx.date) > now) continue;

            if (tx.type === 'income' && tx.accountId === accountId) currentBalance += tx.amount;
            else if (tx.type === 'expense' && tx.accountId === accountId) currentBalance -= tx.amount;
            else if (tx.type === 'transfer') {
                if (tx.accountId === accountId) currentBalance -= tx.amount;
                else if (tx.toAccountId === accountId) currentBalance += tx.amount;
            }
        }

        accDetailCurrentBalance.textContent = formatCurrency(currentBalance);
        accDetailCurrentBalance.className = `font-bold ${currentBalance > 0 ? 'text-green-600' : (currentBalance < 0 ? 'text-red-600' : 'text-gray-600')}`;

        relevantTxs.sort((a, b) => new Date(a.date) - new Date(b.date));

        const txRows = [];
        let runningBalanceForPeriod = account.initialBalance || 0; 
        
        let startBalanceForPeriod = account.initialBalance || 0;
        
        if (viewMode !== 'all') {
            const transactionsBeforePeriod = allTxs.filter(tx => {
                const txDate = new Date(tx.date);
                if (viewMode === 'month') {
                     return txDate < new Date(currentDate); 
                } else if (viewMode === 'year') {
                     return txDate.getFullYear() < parseInt(currentDate.slice(0, 4));
                }
                return false; 
            });

            let balanceBeforePeriod = account.initialBalance || 0;
            for (const tx of transactionsBeforePeriod) {
                if (tx.type === 'income' && tx.accountId === accountId) balanceBeforePeriod += tx.amount;
                else if (tx.type === 'expense' && tx.accountId === accountId) balanceBeforePeriod -= tx.amount;
                else if (tx.type === 'transfer') {
                    if (tx.accountId === accountId) balanceBeforePeriod -= tx.amount;
                    else if (tx.toAccountId === accountId) balanceBeforePeriod += tx.amount;
                }
            }
            startBalanceForPeriod = balanceBeforePeriod;
        }

        runningBalanceForPeriod = startBalanceForPeriod;


        for (const tx of relevantTxs) {
            let txAmount = 0;
            let txAmountSign = '';
            let txAmountClass = 'text-gray-700';
            let isRelevant = false;

            if (tx.type === 'income' && tx.accountId === accountId) {
                txAmount = tx.amount;
                txAmountSign = '+';
                txAmountClass = 'text-green-600';
                runningBalanceForPeriod += txAmount; 
                isRelevant = true;
            } else if (tx.type === 'expense' && tx.accountId === accountId) {
                txAmount = tx.amount;
                txAmountSign = '-';
                txAmountClass = 'text-red-600';
                runningBalanceForPeriod -= txAmount;
                isRelevant = true;
            } else if (tx.type === 'transfer') {
                if (tx.accountId === accountId) {
                    txAmount = tx.amount;
                    txAmountSign = '-';
                    txAmountClass = 'text-blue-600';
                    runningBalanceForPeriod -= txAmount;
                    isRelevant = true;
                } else if (tx.toAccountId === accountId) {
                    txAmount = tx.amount;
                    txAmountSign = '+';
                    txAmountClass = 'text-blue-600';
                    runningBalanceForPeriod += txAmount;
                    isRelevant = true;
                }
            }

            if (isRelevant) {
                const dateObj = new Date(tx.date);
                const mobileDate = dateObj.toLocaleString('th-TH', { day: '2-digit', month: '2-digit' });
                const desktopDate = dateObj.toLocaleString('th-TH', { day: '2-digit', month: 'short', year: '2-digit', hour:'2-digit', minute:'2-digit' });
                const name = escapeHTML(tx.name);
                
                txRows.push({ 
                    id: tx.id, // ID needed for edit/delete buttons
                    mobileDate: mobileDate,
                    desktopDate: desktopDate,
                    name: name,
                    category: tx.type === 'transfer' ? 'โอน' : escapeHTML(tx.category),
                    amountSign: txAmountSign,
                    amount: formatCurrency(tx.amount).replace('฿', '').split('.')[0], 
                    amountClass: txAmountClass,
                    finalBalance: formatCurrency(runningBalanceForPeriod).replace('฿', '').split('.')[0],
                    receiptBase64: tx.receiptBase64,
					desc: tx.desc					
                });
            }
        }
        
        txRows.reverse(); 


        if (txRows.length === 0) {
            listBody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-gray-500 text-base">ไม่มีรายการเคลื่อนไหวในรอบที่เลือก</td></tr>';
            return;
        }

        listBody.innerHTML = txRows.map(row => {
            const balanceVal = parseFloat(row.finalBalance.replace(/,/g,""));
            const balanceClass = balanceVal >= 0 ? 'text-blue-700' : 'text-red-700';
            
            const receiptIconHtml = row.receiptBase64 ? 
                `<button type="button" class="view-receipt-icon text-purple-500 hover:text-purple-700 ml-2 z-10 relative" data-base64="${row.receiptBase64}" title="คลิกเพื่อดูรูป">
                    <i class="fa-solid fa-receipt"></i>
                </button>` : '';

            return `
				<tr class="border-b border-gray-100 hover:bg-gray-50">
					<td class="p-2 text-sm text-gray-500">${row.desktopDate}</td>
					<td class="p-2">
						<div class="font-medium text-gray-800">${row.name}${receiptIconHtml}</div>
						${row.desc ? `<div class="text-xs text-gray-400 mt-1 italic">${escapeHTML(row.desc)}</div>` : ''}
						<div class="text-xs text-gray-400 md:hidden">${row.category}</div>
					</td>
					<td class="p-2 text-sm text-gray-600 hidden md:table-cell">${row.category}</td>
					<td class="p-2 text-right ${row.amountClass} font-bold">${row.amountSign}${row.amount}</td>
					<td class="p-2 text-center">
						<div class="flex items-center justify-center gap-1">
							<button class="edit-btn text-blue-500 p-1" data-id="${row.id}"><i class="fa-solid fa-pencil text-xs"></i></button>
							<button class="delete-btn text-red-500 p-1" data-id="${row.id}"><i class="fa-solid fa-trash text-xs"></i></button>
						</div>
					</td>
				</tr>
			`;
        }).join('');
    }
    // *******************************************************
    
    function populateAccountDropdowns(selectId, filterFn = null) {
        const selectEl = document.getElementById(selectId);
        selectEl.innerHTML = '';
        
        let accountsToDisplay = getSortedAccounts(); 
        
        if (filterFn) {
            accountsToDisplay = accountsToDisplay.filter(filterFn);
        }

        if (accountsToDisplay.length === 0) {
            selectEl.innerHTML = '<option value="">-- ไม่มีบัญชี --</option>';
            return;
        }

        accountsToDisplay.forEach(acc => {
            const icon = acc.type === 'credit' ? '💳' : (acc.type === 'liability' ? '🧾' : '💵');
            selectEl.insertAdjacentHTML('beforeend', 
                `<option value="${acc.id}">${icon} ${escapeHTML(acc.name)}</option>`
            );
        });
    }

    function updateFormVisibility() {
        const getEl = (id) => document.getElementById(id);
        const type = document.querySelector('input[name="tx-type"]:checked').value;
        
        const accountContainer = getEl('tx-account-container');
        const fromContainer = getEl('tx-account-from-container');
        const toContainer = getEl('tx-account-to-container');
        const nameContainer = getEl('tx-name-container');
        const categoryContainer = getEl('tx-category-container');
        
        [accountContainer, fromContainer, toContainer, nameContainer, categoryContainer].forEach(el => el.classList.add('hidden'));
        
        getEl('tx-account').required = false;
        getEl('tx-account-from').required = false;
        getEl('tx-account-to').required = false;
        getEl('tx-name').required = false;
        getEl('tx-category').required = false;

        if (type === 'income' || type === 'expense') {
            accountContainer.classList.remove('hidden');
            nameContainer.classList.remove('hidden');
            categoryContainer.classList.remove('hidden');
            
            getEl('tx-account').required = true;
            getEl('tx-name').required = true;
            getEl('tx-category').required = true;
            
            updateCategoryDropdown(type);
        } else if (type === 'transfer') {
            fromContainer.classList.remove('hidden');
            toContainer.classList.remove('hidden');
            nameContainer.classList.remove('hidden'); 
            
            getEl('tx-name').required = true; 
            getEl('tx-account-from').required = true;
            getEl('tx-account-to').required = true;
        }
    }


    // แก้ไขฟังก์ชันนี้ให้รองรับการส่ง ID ของ Dropdown เป้าหมายเข้าไปได้
    function updateCategoryDropdown(type = null, targetId = 'tx-category') {
        const selectedType = type || document.querySelector('input[name="tx-type"]:checked').value;
        
        // ถ้าเป็นโหมดโอนย้าย ไม่ต้องทำอะไรกับ dropdown หมวดหมู่
        if (selectedType === 'transfer') return;
        
        const categories = state.categories[selectedType] || [];
        const dropdown = document.getElementById(targetId); // <--- ต้องใช้ targetId
        
        if (!dropdown) return; 

        dropdown.innerHTML = '';
        if (Array.isArray(categories) && categories.length > 0) {
            categories.forEach(cat => {
                dropdown.insertAdjacentHTML('beforeend', `<option value="${escapeHTML(cat)}">${escapeHTML(cat)}</option>`);
            });
        } else {
            dropdown.insertAdjacentHTML('beforeend', `<option value="">-- ไม่มีหมวดหมู่ --</option>`);
        }
    }

    async function handleFormSubmit(e) {
		e.preventDefault();
		document.getElementById('calculator-popover').classList.add('hidden');

		const getEl = (id) => document.getElementById(id);
		
		const rawAmount = getEl('tx-amount').value;
		let finalAmount = safeCalculate(rawAmount);
		if (finalAmount === null || finalAmount <= 0) {
			Swal.fire('ข้อมูลไม่ครบถ้วน', 'จำนวนเงินไม่ถูกต้อง (ต้องมากกว่า 0)', 'warning');
			return;
		}
		finalAmount = parseFloat(finalAmount.toFixed(2));
		const txId = getEl('tx-id').value;
		const type = document.querySelector('input[name="tx-type"]:checked').value;
		
		let transaction = {
			id: txId || `tx-${new Date().getTime()}`,
			type: type,
			amount: finalAmount,
			date: getEl('tx-date').value,
			desc: getEl('tx-desc').value.trim() || null,
			name: null,
			category: null,
			accountId: null,
			toAccountId: null,
			receiptBase64: currentReceiptBase64 
		};

		transaction.name = getEl('tx-name').value.trim();

		if (type === 'income' || type === 'expense') {
			transaction.category = getEl('tx-category').value;
			transaction.accountId = getEl('tx-account').value;
			
			if (!transaction.name || !transaction.category || !transaction.accountId) {
				Swal.fire('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกชื่อรายการ, หมวดหมู่, และบัญชี', 'warning');
				return;
			}

			const learnData = {
				name: transaction.name,
				type: transaction.type,
				category: transaction.category,
				amount: transaction.amount
			};
			dbPut(STORE_AUTO_COMPLETE, learnData).catch(err => console.warn("Auto-learn failed", err));
			const existingIndex = state.autoCompleteList.findIndex(item => item.name === transaction.name);
			if (existingIndex >= 0) {
				 state.autoCompleteList[existingIndex] = learnData;
			} else {
				 state.autoCompleteList.push(learnData);
			}

		} else if (type === 'transfer') {
			if (!transaction.name) transaction.name = 'โอนย้าย';

			transaction.accountId = getEl('tx-account-from').value;
			transaction.toAccountId = getEl('tx-account-to').value;
			
			if (!transaction.accountId || !transaction.toAccountId) {
				Swal.fire('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือกบัญชีต้นทางและปลายทาง', 'warning');
				return;
			}
			if (transaction.accountId === transaction.toAccountId) {
					Swal.fire('ข้อมูลผิดพลาด', 'บัญชีต้นทางและปลายทางต้องไม่ซ้ำกัน', 'warning');
				return;
			}
		}

		try {
			// 1. บันทึกรายการลง DB หลัก
			await dbPut(STORE_TRANSACTIONS, transaction);

			// =========================================================
			// [ส่วนที่เพิ่ม] ตรวจสอบและลบ Draft หลังจากบันทึกสำเร็จ
			// =========================================================
			const hiddenDraftInput = document.getElementById('hidden-draft-id');
			const draftIdToDelete = hiddenDraftInput ? hiddenDraftInput.value : null;

			if (draftIdToDelete) {
				try {
					// ลบออกจาก Store Draft
					await dbDelete(STORE_DRAFTS, draftIdToDelete);
					// ล้างค่า ID ที่ซ่อนไว้
					if(hiddenDraftInput) hiddenDraftInput.value = ''; 
					// อัปเดตกล่องแสดงผลหน้าแรก
					if (typeof renderDraftsWidget === 'function') {
						renderDraftsWidget(); 
					}
				} catch (e) {
					console.error("Error deleting draft:", e);
				}
			}
			// =========================================================

			// เช็คว่าถ้ามี txId แสดงว่าเป็นการ "แก้ไข" ถ้าไม่มีคือ "เพิ่มใหม่"
			const actionType = txId ? 'edit' : 'add'; 
			sendLineAlert(transaction, actionType);
			
			if (txId) {
				const oldTx = state.transactions.find(t => t.id === txId);
				state.transactions = state.transactions.map(t => t.id === txId ? transaction : t);
				setLastUndoAction({ type: 'tx-edit', oldData: JSON.parse(JSON.stringify(oldTx)), newData: transaction });
			} else {
				state.transactions.push(transaction);
				setLastUndoAction({ type: 'tx-add', data: transaction });
			}
			
			// Logic บันทึก Recurring
			const txRecurringCheckbox = document.getElementById('tx-is-recurring'); 
			const isRecurring = txRecurringCheckbox ? txRecurringCheckbox.checked : false;
			
			if (isRecurring) {
				const freq = document.getElementById('tx-recurring-freq').value;
				const nextDueDate = calculateNextDueDate(transaction.date.slice(0, 10), freq);
				
				const newRule = {
					id: `rec-${Date.now()}`,
					name: transaction.name,
					amount: transaction.amount,
					type: transaction.type,
					category: transaction.category || 'โอนย้าย', 
					accountId: transaction.accountId,
					toAccountId: transaction.toAccountId || null, 
					frequency: freq,
					nextDueDate: nextDueDate, 
					active: true
				};

				await dbPut(STORE_RECURRING, newRule);
				state.recurringRules.push(newRule);
			}

			if (currentPage === 'home') {
				renderAll();
			}
			if (currentPage === 'list') {
				renderListPage();
			}
			if (currentPage === 'calendar') { 
				renderCalendarView();
			}

			await refreshAccountDetailModalIfOpen();
			
			renderBudgetWidget();
			renderDropdownList();
			
			closeModal();
			renderSettings();
			const isLogged = window.auth && window.auth.currentUser;

			Swal.fire({
				title: 'บันทึกสำเร็จ!',
				text: 'บันทึกข้อมูลของคุณเรียบร้อยแล้ว',
				icon: 'success',
				timer: isLogged ? 1000 : undefined, 
				showConfirmButton: !isLogged 
			});
		} catch (err) {
			console.error("Failed to save transaction:", err);
			Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลลงฐานข้อมูลได้', 'error');
		}
	}

          function safeCalculate(expression) {
			try {
				let sanitized = String(expression).replace(/,/g, '').replace(/\s/g, '');
				if (!/^-?[0-9+\-*/.]+$/.test(sanitized)) { return null;
				} 
				if (!/^-?[0-9.]/.test(sanitized) || !/[0-9.]$/.test(sanitized)) { return null;
				}
				if (/[\+\-\*\/]{2,}/.test(sanitized)) { return null;
				}
				const result = eval(sanitized);
				if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) { return null;
				}
				return result;
			} catch (error) {
				return null;
			}
		}


    function handleCalcPreview(expression, previewId) {
        const previewEl = document.getElementById(previewId);
			if (!expression) {
				previewEl.textContent = '';
				return;
			}

			const lastChar = expression.trim().slice(-1);
			if (['+', '-', '*', '/'].includes(lastChar)) {
					previewEl.textContent = '';
				return;
			}

			const result = safeCalculate(expression);
			if (result !== null) {
				previewEl.textContent = '= ' + parseFloat(result.toFixed(2));
			} else {
				previewEl.textContent = '';
			}
		}


    function handleCalcClick(btn, inputId, popoverId, previewId, displayId) {
		const input = document.getElementById(inputId);
		const value = btn.getAttribute('data-value');
		
		const previewEl = document.getElementById(previewId);
		const displayEl = document.getElementById(displayId);

		if (!input) return;

		if (value === 'C') {
			input.value = '';
		} else if (value === 'backspace') {
			input.value = input.value.toString().slice(0, -1);
		} else if (value === '=' || value === 'enter') { // เพิ่มเงื่อนไข enter ตรงนี้
			try {
				const sanitized = input.value.replace(/[^0-9+\-*/().]/g, '');
				if (sanitized) {
					const result = Function('"use strict";return (' + sanitized + ')')();
					input.value = parseFloat(result.toFixed(2));
				}
			} catch (e) {
				console.error("Calculation Error", e);
			}


// ========================================
// ADDITIONAL UI FUNCTIONS
// ========================================


// ========================================
// REFRESH ALL UI
// ========================================
    async function refreshAllUI() {
                renderSettings();
                if (currentPage === 'home') {
                    renderAll();
                } else if (currentPage === 'list') {
                    renderListPage();
                } else if (currentPage === 'calendar') { 
                    renderCalendarView();
                }
				
				renderBudgetWidget();
            }


// ========================================
// GUIDE PAGE & CHARTS
// ========================================
					const alreadyLogged = state.notificationHistory.some(h => h.historyKey === historyKey);

					if (!alreadyLogged) {
						state.notificationHistory.unshift({ // เพิ่มไว้บนสุด
							historyKey: historyKey,
							date: dateStr,
							time: timeStr,
							title: alert.title,
							message: alert.message,
							icon: alert.icon,
							color: alert.color
						});
						historyChanged = true;
					}
				});

				// ถ้ามีการเพิ่มประวัติใหม่ ให้บันทึกลง DB
				if (historyChanged) {
					// จำกัดประวัติไว้แค่ 100 รายการล่าสุด เพื่อไม่ให้หนักเครื่อง
					if (state.notificationHistory.length > 100) {
						state.notificationHistory = state.notificationHistory.slice(0, 100);
					}
					await dbPut(STORE_CONFIG, { key: 'notification_history', value: state.notificationHistory });
					
					// ถ้าเปิดหน้า History อยู่ให้รีเฟรช
					if(typeof renderNotificationHistory === 'function') renderNotificationHistory();
				}
				// -----------------------------------------------------

				// สร้าง HTML สำหรับ Modal (เหมือนเดิม)
				content.innerHTML = alerts.map(alert => `
					<div class="bg-gray-50 p-4 rounded-2xl border-l-8 ${alert.color ? alert.color.replace('text', 'border') : 'border-purple-500'} shadow-sm flex items-start gap-4">
						<div class="mt-1 text-2xl ${alert.color || 'text-purple-600'}">
							<i class="fa-solid ${alert.icon}"></i>
						</div>
						<div>
							<h3 class="font-bold text-xl text-gray-800">${alert.title}</h3>
							<p class="text-gray-600 text-lg">${alert.message}</p>
						</div>
					</div>
				`).join('');

				modal.classList.remove('hidden');

				btnAck.onclick = () => {
					modal.classList.add('hidden');
					
					// +++ [แทรกตรงนี้] แจ้ง Cloud ว่ารายการเหล่านี้ "อ่านแล้ว" +++
					// เครื่องอื่นที่เปิดอยู่ จะได้รับข้อมูลนี้และปิด Modal ลงอัตโนมัติ
					alerts.forEach(alertItem => {
						saveToCloud(STORE_NOTIFICATIONS, { 
							id: alertItem.id, 
							isRead: true 
						});
					});
				};

				btnIgnore.onclick = async () => {
					const newIgnored = alerts.map(a => a.id);
					state.ignoredNotifications = [...state.ignoredNotifications, ...newIgnored];
					await dbPut(STORE_CONFIG, { key: 'ignored_notifications', value: state.ignoredNotifications });
					modal.classList.add('hidden');
					showToast('จะไม่แจ้งเตือนรายการเหล่านี้อีก', 'success');
				};
			}
			
			// --- ฟังก์ชันแสดงรายการแจ้งเตือนในหน้าตั้งค่า ---
			function renderCustomNotificationsList() {
				const container = document.getElementById('custom-notification-list');
				if (!container) return;

				if (!state.customNotifications || state.customNotifications.length === 0) {
					container.innerHTML = '<p class="text-gray-400 text-center py-4 border-2 border-dashed border-gray-100 rounded-xl">ไม่มีรายการแจ้งเตือน</p>';
					return;
				}

				// เรียงลำดับตามวันที่เป้าหมาย
				const sortedNotis = [...state.customNotifications].sort((a, b) => new Date(a.date) - new Date(b.date));

				let html = '';
				sortedNotis.forEach(noti => {
					const dateObj = new Date(noti.date);
					const dateStr = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
					
					// คำนวณวันแจ้งเตือนจริง
					const alertDate = new Date(dateObj);
					alertDate.setDate(alertDate.getDate() - (noti.advanceDays || 0));
					const alertDateStr = alertDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

					html += `
						<div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-sm transition">
							<div class="flex items-start gap-3">
								<div class="bg-orange-100 text-orange-600 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
									<i class="fa-regular fa-bell"></i>
								</div>
								<div>
									<div class="font-bold text-gray-800">${noti.message}</div>
									<div class="text-sm text-gray-500">
										เป้าหมาย: <span class="text-purple-600 font-medium">${dateStr}</span>
										${noti.advanceDays > 0 ? `<span class="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full ml-1">เตือนก่อน ${noti.advanceDays} วัน (${alertDateStr})</span>` : ''}
									</div>
								</div>
							</div>
							<button onclick="deleteCustomNotification('${noti.id}')" class="text-gray-400 hover:text-red-500 p-2 transition">
								<i class="fa-solid fa-trash"></i>
							</button>
						</div>
					`;
				});

				container.innerHTML = html;
			}

			// ฟังก์ชันลบแจ้งเตือน
			async function deleteCustomNotification(id) {
				const result = await Swal.fire({
					title: 'ลบการแจ้งเตือน?',
					text: "คุณต้องการลบรายการนี้ใช่ไหม",
					icon: 'warning',
					showCancelButton: true,
					confirmButtonColor: '#ef4444',
					confirmButtonText: 'ลบ',
					cancelButtonText: 'ยกเลิก'
				});

				if (result.isConfirmed) {
					state.customNotifications = state.customNotifications.filter(n => n.id !== id);
					await dbPut(STORE_CONFIG, { key: 'custom_notifications_list', value: state.customNotifications });
					renderCustomNotificationsList();
					showToast('ลบเรียบร้อย', 'success');
				}
			}

			// ============================================
			// [UPDATED] DUAL ANALYTICS CHARTS (รองรับ Dark Mode)
			// ============================================
			function renderAnalyticsChart(filteredData) {
				const container = document.getElementById('analytics-section');
				const ctxCat = document.getElementById('chart-category');
				const ctxTime = document.getElementById('chart-time');
				
				// ถ้าไม่มีข้อมูล ให้ซ่อนทั้งแผง
				if (!filteredData || filteredData.length === 0) {
					if(container) container.classList.add('hidden');
					return;
				}
				if(container) container.classList.remove('hidden');

				// 1. เตรียมข้อมูล
				// ------------------------------------------
				const catMap = {};
				filteredData.forEach(tx => {
					if (state.advFilterType === 'all' && tx.type !== 'expense') return; 
					if (state.advFilterType !== 'all' && tx.type !== state.advFilterType) return;

					const cat = tx.category || 'อื่นๆ';
					catMap[cat] = (catMap[cat] || 0) + tx.amount;
				});

				const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
				const catLabels = [];
				const catData = [];
				let otherSum = 0;
				
				sortedCats.forEach((item, index) => {
					if (index < 5) {
						catLabels.push(item[0]);
						catData.push(item[1]);
					} else {
						otherSum += item[1];
					}
				});
				if (otherSum > 0) {
					catLabels.push('อื่นๆ');
					catData.push(otherSum);
				}

				const dateMap = {};
				const sortedByDate = [...filteredData].sort((a, b) => new Date(a.date) - new Date(b.date));
				
				sortedByDate.forEach(tx => {
					if (state.advFilterType !== 'all' && tx.type !== state.advFilterType) return;
					
					const d = new Date(tx.date);
					const dateKey = `${d.getDate()}/${d.getMonth()+1}`;
					dateMap[dateKey] = (dateMap[dateKey] || 0) + tx.amount;
				});
				const timeLabels = Object.keys(dateMap);
				const timeData = Object.values(dateMap);


				// 2. ตั้งค่าสี (Color Config)
				// ------------------------------------------
				// เช็คว่ากำลังเปิด Dark Mode อยู่หรือไม่
				const isDark = state.isDarkMode || document.body.classList.contains('dark');
				const textColor = isDark ? '#e5e7eb' : '#4b5563';  // สีขาวเทา vs สีเทาเข้ม
				const gridColor = isDark ? '#374151' : '#e5e7eb'; // สีเส้น Grid

				// --- Graph 1: Doughnut ---
				if (chartInstanceCategory) chartInstanceCategory.destroy();
				
				if (ctxCat) {
					chartInstanceCategory = new Chart(ctxCat, {
						type: 'doughnut',
						data: {
							labels: catLabels,
							datasets: [{
								data: catData,
								backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#C9CBCF'],
								borderWidth: 0,
								hoverOffset: 10
							}]
						},
						options: {
							responsive: true,
							maintainAspectRatio: false,
							layout: { padding: 0 },
							cutout: '65%',
							plugins: {
								legend: { 
									position: 'top', 
									align: 'start',
									labels: { 
										boxWidth: 10, 
										padding: 10, 
										font: { size: 11, family: "'Prompt', sans-serif" },
										usePointStyle: true,
										color: textColor // ปรับสีตัวอักษร Legend
									} 
								},
								tooltip: {
									callbacks: {
										label: function(context) {
											return ' ' + context.label + ': ' + formatCurrency(context.raw);
										}
									}
								}
							}
						}
					});
				}

				// --- Graph 2: Bar ---
				if (chartInstanceTime) chartInstanceTime.destroy();

				if (ctxTime) {
					chartInstanceTime = new Chart(ctxTime, {
						type: 'bar',
						data: {
							labels: timeLabels,
							datasets: [{
								label: 'ยอดเงิน',
								data: timeData,
								backgroundColor: '#8b5cf6',
								borderRadius: 4,
								barPercentage: 0.7,
							}]
						},
						options: {
							responsive: true,
							maintainAspectRatio: false,
							layout: { padding: { top: 10, bottom: 0, left: 0, right: 0 } },
							plugins: {
								legend: { display: false },
								tooltip: {
									callbacks: { label: (c) => formatCurrency(c.raw) }
								}
							},
							scales: {
								x: { 
									grid: { display: false }, 
									ticks: { 
										font: { size: 10 }, 
										maxRotation: 0, 
										autoSkip: true,
										color: textColor // ปรับสีตัวอักษรแกน X
									} 
								},
								y: { 
									display: false, 
									beginAtZero: true 
								}
							}
						}
					});
				}
			}


// ========================================
// TOGGLE ACCOUNT VISIBILITY
// ========================================
			// [NEW] ฟังก์ชันสำหรับสวิตช์ เปิด/ปิด การแสดงบัญชี
			window.toggleAccountVisibility = async function(accountId, isChecked) {
				const account = state.accounts.find(a => a.id === accountId);
				if (account) {
					account.isVisible = isChecked; // อัปเดตสถานะ
					await dbPut(STORE_ACCOUNTS, account); // บันทึกลงฐานข้อมูล
					
					// รีเฟรชหน้าจอทั้งหมดเพื่อให้เห็นผลทันที
					renderAccountSettingsList(); 
					if (typeof renderAll === 'function') renderAll();
				}
			};


// ========================================
// QUICK DRAFT FUNCTIONS
// ========================================
			// ============================================
			// QUICK DRAFT FUNCTIONS (แก้ไขให้เข้ากับของเดิม)
			// ============================================
			// 1. ฟังก์ชันสั่งงานด้วยเสียงสำหรับ Draft (ปรับปรุงใหม่ รองรับ Browser มากขึ้น)
			window.startQuickDraftVoice = function() {
				// ตรวจสอบหาตัว API ทั้งแบบมาตรฐาน และแบบ Webkit (Chrome/Safari)
				const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

				if (!SpeechRecognition) {
					Swal.fire({
						icon: 'error',
						title: 'ไม่รองรับการสั่งเสียง',
						html: 'Browser นี้ไม่รองรับฟีเจอร์แปลงเสียงเป็นข้อความ<br><br>แนะนำให้ใช้ <b>Google Chrome</b> หรือ <b>Safari</b><br>และต้องใช้งานผ่าน <b>HTTPS</b> เท่านั้น'
					});
					return;
				}

				// สร้าง Object recognition ถ้ายังไม่มี
				if (!window.recognition) {
					window.recognition = new SpeechRecognition();
					window.recognition.lang = 'th-TH'; // ภาษาไทย
					window.recognition.continuous = false; // ฟังทีละประโยคแล้วหยุด
					window.recognition.interimResults = false;

					// ตั้งค่า Event Handlers (ทำแค่ครั้งเดียวตอนสร้าง)
					window.recognition.onresult = (event) => {
						const transcript = event.results[0][0].transcript;
						console.log('Draft Voice:', transcript);

						// เรียกใช้ฟังก์ชัน parseVoiceInput ตัวเดิมของคุณ
						const parsed = parseVoiceInput(transcript); 

						if (parsed && parsed.amount) {
							document.getElementById('draft-amount').value = parsed.amount;
							
							let fullNote = parsed.name || '';
							if (parsed.description) fullNote += ' ' + parsed.description;
							if (!fullNote.trim()) fullNote = transcript.replace(parsed.amount, '').replace('บาท', '').trim();

							document.getElementById('draft-note').value = fullNote;
						} else {
							document.getElementById('draft-note').value = transcript;
						}
						stopVoiceUI();
					};

					window.recognition.onerror = (event) => {
						console.error("Voice Error:", event.error);
						stopVoiceUI();
						
						let msg = 'เกิดข้อผิดพลาดในการรับเสียง';
						if (event.error === 'not-allowed') msg = 'กรุณากดอนุญาตให้ใช้ไมโครโฟน';
						if (event.error === 'network') msg = 'กรุณาตรวจสอบอินเทอร์เน็ต';
						
						if (event.error !== 'no-speech' && event.error !== 'aborted') {
							showToast(msg, 'error');
						}
					};

					window.recognition.onend = () => {
						stopVoiceUI();
					};
				}

				// เริ่มต้นการทำงาน UI
				const btn = document.getElementById('btn-draft-voice');
				const originalHtml = '<i class="fa-solid fa-microphone"></i> พูดเพื่อจด (เช่น "ข้าว 50")';
				
				btn.innerHTML = '<i class="fa-solid fa-microphone-lines fa-beat"></i> กำลังฟัง...';
				btn.classList.add('bg-red-500', 'text-white', 'border-red-600');
				btn.classList.remove('bg-gray-100', 'text-gray-600');

				try {
					window.recognition.start();
				} catch (e) {
					// กรณีมีการกดรัวๆ หรือ service ทำงานค้างอยู่
					console.warn("Recognition already started or error:", e);
					window.recognition.stop();
				}

				// ฟังก์ชันคืนค่าปุ่ม
				function stopVoiceUI() {
					if(btn) {
						btn.innerHTML = originalHtml;
						btn.classList.remove('bg-red-500', 'text-white', 'border-red-600', 'fa-beat');
						btn.classList.add('bg-gray-100', 'text-gray-600');
					}
				}
			}

			// 2. บันทึก Draft (Update: เพิ่ม window. นำหน้า)
			window.saveQuickDraft = async function() {
				const amountVal = document.getElementById('draft-amount').value;
				const noteVal = document.getElementById('draft-note').value.trim();

				if (!amountVal || parseFloat(amountVal) <= 0) {
					Swal.fire('ระบุยอดเงิน', 'กรุณาใส่จำนวนเงิน', 'warning');
					return;
				}
				
				const now = new Date();
				const localIsoString = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

				const draft = {
					id: `draft-${Date.now()}`,
					amount: parseFloat(amountVal),
					desc: noteVal || 'รายการเร่งด่วน',
					date: localIsoString
				};

				try {
					// ตรวจสอบว่า db พร้อมใช้งานหรือไม่
					if (typeof db === 'undefined') {
						 console.error("Database not initialized");
						 return;
					}
					
					await dbPut(STORE_DRAFTS, draft);
					
					if (typeof closeQuickDraftModal === 'function') closeQuickDraftModal();
					if (typeof renderDraftsWidget === 'function') renderDraftsWidget();
					
					showToast('จดร่างรายการไว้แล้ว', 'success');
				} catch (err) {
					console.error(err);
					Swal.fire('Error', 'บันทึกไม่สำเร็จ: ' + err.message, 'error');
				}
			}

			// 3. แสดง Widget รายการ Draft
			window.renderDraftsWidget = async function() {
				const container = document.getElementById('home-drafts-container');
				if (!container) return;

				try {
					const drafts = await dbGetAll(STORE_DRAFTS);
					
					if (drafts.length === 0) {
						container.classList.add('hidden');
						return;
					}

					container.classList.remove('hidden');
					const listEl = document.getElementById('drafts-list');
					listEl.innerHTML = '';

					drafts.forEach(draft => {
						// [ส่วนที่ 1] แปลงวันที่และเวลาให้เป็น format ไทย
						// ถ้าระบบใหม่มี draft.date ก็ใช้เลย / ถ้าระบบเก่าไม่มี ให้ดึงจาก id (timestamp)
						let dateObj;
						if (draft.date) {
							dateObj = new Date(draft.date);
						} else {
							// รองรับข้อมูลเก่าที่เก็บ id เป็น timestamp (ตัดคำว่า draft- ออก)
							const timestamp = parseInt(draft.id.replace('draft-', ''));
							dateObj = new Date(timestamp);
						}

						const dateStr = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
						const timeStr = dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

						// [ส่วนที่ 2] HTML เพิ่มส่วนแสดงวันที่ (บรรทัดล่างสุด)
						const html = `
							<div class="flex justify-between items-center bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-700 mb-3 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition shadow-sm group"
								 onclick="convertDraftToTx('${draft.id}')">
								<div class="flex items-center gap-4">
									<div class="bg-yellow-200 dark:bg-yellow-600/80 text-yellow-800 dark:text-yellow-100 w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
										<i class="fa-solid fa-pen-nib text-lg"></i>
									</div>
									<div>
										<div class="font-black text-xl text-gray-800 dark:text-white mb-0.5">${formatCurrency(draft.amount)}</div>
										<div class="text-sm font-medium text-gray-600 dark:text-gray-300">${escapeHTML(draft.desc)}</div>
										
										<div class="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
											<i class="fa-regular fa-clock"></i> ${dateStr} ${timeStr} น.
										</div>
									</div>
								</div>
								<div class="text-gray-400 dark:text-gray-500 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
									<i class="fa-solid fa-chevron-right text-xl"></i>
								</div>
							</div>
						`;
						listEl.insertAdjacentHTML('beforeend', html);
					});

				} catch (err) {
					console.error("Error loading drafts:", err);
				}
			}

			// 4. แปลง Draft เป็นรายการจริง
			window.convertDraftToTx = async function(draftId) {
				try {
					const draft = await dbGet(STORE_DRAFTS, draftId);
					if (!draft) return;

					openModal(); // เปิดหน้าบันทึก
					
					// เติมข้อมูลลงฟอร์ม
					document.getElementById('tx-amount').value = draft.amount;
					document.getElementById('tx-desc').value = draft.desc;
					
					// [เพิ่มใหม่] ตรวจสอบและเติมวันที่เดิม (ถ้ามี)
					if (draft.date) {
						document.getElementById('tx-date').value = draft.date;
					} else {
						// กรณี Draft เก่าที่ไม่มีวันที่เก็บไว้ ให้ใช้วันปัจจุบัน
						const now = new Date();
						document.getElementById('tx-date').value = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
					}
					
					// Trigger ให้คำนวณเลข (ถ้ามีระบบคำนวณ)
					const amountInput = document.getElementById('tx-amount');
					if(amountInput) amountInput.dispatchEvent(new Event('keyup'));

					// [ใหม่] ฝาก ID ไว้ใน input ที่ซ่อนไว้ (ยังไม่ลบจาก DB)
					const hiddenInput = document.getElementById('hidden-draft-id');
					if(hiddenInput) hiddenInput.value = draftId;

					// *** ลบโค้ด dbDelete เดิมออกไปแล้ว ***
					
					showToast('ดึงข้อมูลมาแล้ว กรุณาตรวจสอบและกดบันทึก', 'info');
					
				} catch (err) {
					console.error(err);
				}
			}

			// 5. เปิด/ปิด Modal
			window.openQuickDraftModal = () => {
				const modal = document.getElementById('quick-draft-modal');
				if(modal) {
					modal.classList.remove('hidden');
					setTimeout(() => {
						const input = document.getElementById('draft-amount');
						if(input) input.focus();
					}, 100);
				}
			}

			window.closeQuickDraftModal = () => {
				const modal = document.getElementById('quick-draft-modal');
				if(modal) {
					modal.classList.add('hidden');
					document.getElementById('draft-amount').value = '';
					document.getElementById('draft-note').value = '';
				}
			}
			


// ========================================
// REMAINING UI FUNCTIONS
// ========================================
			
			// ============================================
			// SMART VOICE COMMAND (ผู้ช่วยสั่งงานด้วยเสียง)
			// ============================================

			window.activateVoiceCommand = function() {
				// 1. ตรวจสอบ API
				const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
				if (!SpeechRecognition) {
					Swal.fire('ไม่รองรับ', 'Browser นี้ไม่รองรับคำสั่งเสียง', 'error');
					return;
				}

				const btn = document.getElementById('smart-voice-btn');
				const ripple = document.getElementById('smart-voice-ripple');
				const icon = btn.querySelector('i');

				// 2. แต่งปุ่มให้รู้ว่ากำลังฟัง
				btn.classList.remove('from-blue-500', 'to-cyan-500');
				btn.classList.add('from-red-500', 'to-pink-500', 'scale-110');
				icon.classList.remove('fa-microphone');
				icon.classList.add('fa-ear-listen', 'fa-beat');
				ripple.classList.add('animate-ping', 'opacity-75');

				// 3. เริ่มฟัง
				const recognition = new SpeechRecognition();
				recognition.lang = 'th-TH';
				recognition.continuous = false; // ฟังประโยคเดียวจบ
				recognition.interimResults = false;

				recognition.onresult = (event) => {
					const transcript = event.results[0][0].transcript.trim();
					console.log('Voice Command:', transcript);
					
					// ส่งไปประมวลผล
					executeCommand(transcript);
				};

				recognition.onerror = (event) => {
					console.error(event.error);
					if(event.error !== 'no-speech') {
						showToast('ฟังไม่ทัน กรุณาลองใหม่', 'warning');
					}
				};

				recognition.onend = () => {
					// คืนค่าปุ่มสู่สภาพเดิม
					btn.classList.add('from-blue-500', 'to-cyan-500');
					btn.classList.remove('from-red-500', 'to-pink-500', 'scale-110');
					icon.classList.add('fa-microphone');
					icon.classList.remove('fa-ear-listen', 'fa-beat');
					ripple.classList.remove('animate-ping', 'opacity-75');
				};

				try {
					recognition.start();
					showToast('พูดคำสั่งได้เลย... (เช่น "กลับบ้าน", "ค้นหา ข้าว")', 'info');
				} catch (e) {
					console.warn(e);
				}
			}

			// ============================================
			// SMART VOICE COMMAND (GLOBAL BRAIN V.7)
			// ============================================

			window.activateGlobalVoice = function() {
				// 1. ตรวจสอบ API
				const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
				if (!SpeechRecognition) {
					Swal.fire('ไม่รองรับ', 'Browser นี้ไม่รองรับคำสั่งเสียง', 'error');
					return;
				}

				const btn = document.getElementById('smart-voice-btn');
				const icon = btn.querySelector('i');

				// 2. แต่งปุ่มให้รู้ว่ากำลังฟัง (UI Feedback)
				btn.classList.remove('from-blue-500', 'to-cyan-500');
				btn.classList.add('from-red-500', 'to-pink-500', 'scale-125', 'ring-4', 'ring-red-200');
				icon.classList.remove('fa-microphone');
				icon.classList.add('fa-ear-listen', 'fa-beat-fade');

				// 3. เริ่มฟัง
				const recognition = new SpeechRecognition();
				recognition.lang = 'th-TH';
				recognition.continuous = false; // ฟังประโยคเดียวจบ
				recognition.interimResults = false;

				recognition.onresult = (event) => {
					const transcript = event.results[0][0].transcript.trim();
					console.log('Global Voice Command:', transcript);
					
					// ส่งไปประมวลผลที่ "สมองกล"
					processGlobalCommand(transcript);
				};

				recognition.onerror = (event) => {
					console.error(event.error);
					if(event.error !== 'no-speech' && event.error !== 'aborted') {
						showToast('ฟังไม่ทัน กรุณาลองใหม่', 'warning');
					}
				};

				recognition.onend = () => {
					// คืนค่าปุ่มสู่สภาพเดิม
					btn.classList.add('from-blue-500', 'to-cyan-500');
					btn.classList.remove('from-red-500', 'to-pink-500', 'scale-125', 'ring-4', 'ring-red-200');
					icon.classList.add('fa-microphone');
					icon.classList.remove('fa-ear-listen', 'fa-beat-fade');
				};

				try {
					recognition.start();
					showToast('พูดคำสั่งได้เลย... (เช่น "กลับบ้าน", "จ่ายค่าไฟ 500")', 'info');
				} catch (e) {
					console.warn(e);
				}
			}

			// ==========================================
			// GLOBAL BRAIN PROCESSOR V.2 (ฉบับสมองกลอัจฉริยะ)
			// ==========================================
			function processGlobalCommand(text) {
				if (!text) return;
				// ทำความสะอาดข้อความ
				text = text.trim().replace(/[.。,]+$/, "").replace(/\s+/g, ' ');
				const lowerText = text.toLowerCase();
				
				console.log("🧠 SMART BRAIN V.7 Analyzing:", text);

				// ===== 1. PRIORITY: คำสั่งระบบด่วน =====
				// ปิด/ยกเลิก ทุกอย่าง (Priority สูงสุด)
				if (lowerText.match(/^(ปิด|ยกเลิก|หยุด|ออก|esc|cancel|ปิดหน้าต่าง|ไปต่อ)/)) {
					closeEverything();
					showToast('ยกเลิกแล้ว', 'info');
					return;
				}
				
				// บันทึก/ตกลง
				if (lowerText.match(/^(บันทึก|เสร็จ|เรียบร้อย|save|ตกลง|ok|โอเค|ยืนยัน|ใช่)/)) {
					const saved = clickSaveButton();
					if (saved) return;
				}
				
				// ความช่วยเหลือ
				if (lowerText.match(/^(ช่วยเหลือ|ช่วย|help|คู่มือ|สอน|วิธีใช้|ใช้งาน)/)) {
					showPage('page-guide');
					speak("เปิดหน้าคู่มือการใช้งานแล้ว คุณสามารถถามเกี่ยวกับวิธีใช้ได้");
					return;
				}

				// ===== 2. CONTEXT AWARE: เช็ค context ปัจจุบัน =====
				const activeContext = detectCurrentContext();
				console.log("Current Context:", activeContext);
				
				// ถ้ามี modal หรือ form เปิดอยู่ ให้ประมวลผลตาม context
				if (activeContext !== 'home') {
					const handled = handleContextualCommand(text, activeContext);
					if (handled) return;
				}

				// ===== 3. SMART MENU NAVIGATION =====
				const menuHandled = handleMenuNavigation(lowerText, text);
				if (menuHandled) return;

				// ===== 4. SMART DATA ENTRY =====
				const dataHandled = handleSmartDataEntry(text, lowerText);
				if (dataHandled) return;

				// ===== 5. SMART SEARCH =====
				const searchHandled = handleSmartSearch(text, lowerText);
				if (searchHandled) return;

				// ===== 6. SETTINGS & CONFIG =====
				const settingsHandled = handleSmartSettings(text, lowerText);
				if (settingsHandled) return;

				// ===== 7. SMART TRANSACTION DETECTION =====
				// ตรวจจับรายการธุรกรรมอัตโนมัติ
				const transactionHandled = handleTransactionDetection(text, lowerText);
				if (transactionHandled) return;

				// ===== 8. FALLBACK: พยายามเดาความหมาย =====
				handleFallbackCommand(text);
			}

			// ===== ฟังก์ชันช่วยตรวจจับ Context =====
			function detectCurrentContext() {
				// ตรวจสอบว่ามี modal เปิดอยู่ไหม
				const modal = document.querySelector('.modal:not(.hidden), [class*="modal"]:not(.hidden)');
				if (modal) {
					if (modal.id === 'form-modal') return 'transaction-form';
					if (modal.id === 'quick-draft-modal') return 'quick-draft';
					if (modal.id.includes('recurring')) return 'recurring-form';
					return 'modal';
				}
				
				// ตรวจสอบ Swal
				if (document.querySelector('.swal2-container')) return 'swal';
				
				// ตรวจสอบหน้า active
				const activePage = document.querySelector('.page.active, [class*="page-"]:not(.hidden)');
				if (activePage) {
					if (activePage.id === 'page-list') return 'list';
					if (activePage.id === 'page-calendar') return 'calendar';
					if (activePage.id === 'page-accounts') return 'accounts';
					if (activePage.id === 'page-settings') return 'settings';
					if (activePage.id === 'page-guide') return 'guide';
				}
				
				return 'home';
			}

			// ===== ฟังก์ชันจัดการคำสั่งตาม Context =====
			function handleContextualCommand(text, context) {
				const lowerText = text.toLowerCase();
				
				switch(context) {
					case 'transaction-form':
						// ในหน้าเพิ่มรายการ
						if (lowerText.match(/^(ประเภท|หมวดหมู่|category)/)) {
							document.getElementById('type-income').focus();
							speak("เลือกประเภทรายการ กด 1 สำหรับรายรับ กด 2 สำหรับรายจ่าย");
							return true;
						}
						if (lowerText.match(/^(จำนวน|เงิน|amount|บาท)/)) {
							document.getElementById('amount').focus();
							speak("กรุณาพูดจำนวนเงิน");
							return true;
						}
						if (lowerText.match(/^(รายละเอียด|หมายเหตุ|note|อะไร)/)) {
							document.getElementById('note').focus();
							speak("กรุณาพูกรายละเอียด");
							return true;
						}
						if (lowerText.match(/^(วันที่|date)/)) {
							document.getElementById('date').focus();
							speak("กรุณาพูดวันที่ในรูปแบบ วันเดือนปี");
							return true;
						}
						break;
						
					case 'list':
						// ในหน้ารายการ
						if (lowerText.match(/^(เรียง|sort|จัด)/)) {
							const sortBtn = document.querySelector('[data-sort]');
							if (sortBtn) sortBtn.click();
							speak("เรียงลำดับรายการแล้ว");
							return true;
						}
						if (lowerText.match(/^(กรอง|filter|เฉพาะ)/)) {
							document.getElementById('adv-filter-search').focus();
							speak("กรุณาพูดคำค้นหาที่ต้องการกรอง");
							return true;
						}
						if (lowerText.match(/^(ส่งออก|export|excel|พิมพ์)/)) {
							exportData();
							speak("กำลังส่งออกข้อมูล");
							return true;
						}
						break;
						
					case 'calendar':
						// ในหน้าปฏิทิน
						if (lowerText.match(/^(วันนี้|today)/)) {
							// กลับไปที่วันปัจจุบัน
							if (typeof calendar !== 'undefined') calendar.today();
							speak("แสดงวันนี้");
							return true;
						}
						if (lowerText.match(/^(เดือนหน้า|next)/)) {
							if (typeof calendar !== 'undefined') calendar.next();
							speak("แสดงเดือนหน้า");
							return true;
						}
						if (lowerText.match(/^(เดือนก่อน|previous)/)) {
							if (typeof calendar !== 'undefined') calendar.prev();
							speak("แสดงเดือนก่อนหน้า");
							return true;
						}
						break;
				}
				
				return false;
			}

			// ===== ฟังก์ชันเมนูอัจฉริยะ =====
			function handleMenuNavigation(lowerText, originalText) {
				// แมปคำสั่งกับหน้า
				const menuMap = {
					'หน้าแรก|home|หลัก|dashboard|เริ่มต้น': 'page-home',
					'รายการ|ประวัติ|list|ทั้งหมด|transaction': 'page-list',
					'ปฏิทิน|calendar|ตาราง|นัดหมาย': 'page-calendar',
					'บัญชี|account|ธนาคาร|กระเป๋า': 'page-accounts',
					'ตั้งค่า|setting|config|configuration|เครื่องมือ': 'page-settings',
					'คู่มือ|guide|help|วิธีใช้|สอน': 'page-guide',
					'รายงาน|report|สถิติ|graph|กราฟ': 'page-reports',
					'แจ้งเตือน|notification|reminder|เตือน': 'page-calendar',
					'หมวดหมู่|category|กลุ่ม|ประเภท': 'page-settings',
					'เป้าหมาย|goal|target|วัตถุประสงค์': 'page-goals',
					'งบประมาณ|budget|แผนการใช้จ่าย': 'page-budget'
				};
				
				// ตรวจสอบคำสั่งเปิด/ไปที่
				for (const [keywords, pageId] of Object.entries(menuMap)) {
					const regex = new RegExp(`(เปิด|ไป|ไปที่|ดู|แสดง|ที่|หน้า|เมนู)\\s*(${keywords})`, 'i');
					if (regex.test(originalText) || lowerText === keywords.split('|')[0]) {
						showPage(pageId);
						
						// พูดคำอธิบายเพิ่มเติม
						const pageNames = {
							'page-home': 'หน้าแรก ภาพรวมทั้งหมด',
							'page-list': 'หน้ารายการ รายรับรายจ่ายทั้งหมด',
							'page-calendar': 'หน้าปฏิทิน แสดงตามวันที่',
							'page-accounts': 'หน้าบัญชี การเงินทั้งหมด',
							'page-settings': 'หน้าตั้งค่า กำหนดค่าต่างๆ',
							'page-guide': 'หน้าคู่มือ วิธีการใช้งาน'
						};
						
						speak(`เปิด${pageNames[pageId] || pageId}แล้ว`);
						return true;
					}
				}
				
				// คำสั่งย่อยในเมนูตั้งค่า
				if (lowerText.includes('ตั้งค่า')) {
					const settingsMap = {
						'ธีม|theme|สี|โหมด': 'theme-settings',
						'ภาษา|language|ไทย|อังกฤษ': 'language-settings',
						'เสียง|sound|พูด|voice': 'voice-settings',
						'แจ้งเตือน|notification': 'notification-settings',
						'ข้อมูล|data|สำรอง|backup': 'backup-settings',
						'ความปลอดภัย|security|รหัส': 'security-settings',
						'เกี่ยวกับ|about|เวอร์ชั่น': 'about-section'
					};
					
					for (const [key, sectionId] of Object.entries(settingsMap)) {
						if (lowerText.includes(key)) {
							showPage('page-settings');
							setTimeout(() => {
								const section = document.getElementById(sectionId);
								if (section && section.classList.contains('hidden')) {
									const toggleBtn = document.querySelector(`[data-target="${sectionId}"]`);
									if (toggleBtn) toggleBtn.click();
								}
								section.scrollIntoView({ behavior: 'smooth' });
							}, 300);
							return true;
						}
					}
				}
				
				return false;
			}

			// ===== ฟังก์ชันใส่ข้อมูลอัจฉริยะ =====
			function handleSmartDataEntry(text, lowerText) {
				// จดบันทึกด่วน
				if (lowerText.match(/^(จด|โน้ต|บันทึก|note|draft|จดไว|ช่วยจำ)\s*(.+)/)) {
					openQuickDraftModal();
					const content = text.replace(/^(จด|โน้ต|บันทึก|note|draft|จดไว|ช่วยจำ)\s*/i, '');
					smartParseContent(content);
					return true;
				}
				
				// เพิ่มบัญชีใหม่
				if (lowerText.match(/^(เพิ่ม|สร้าง)บัญชี\s*(.+)/)) {
					showPage('page-accounts');
					const accountName = text.replace(/^(เพิ่ม|สร้าง)บัญชี\s*/i, '');
					setTimeout(() => {
						document.getElementById('input-account-name').value = accountName;
						document.getElementById('input-account-name').focus();
						speak(`เตรียมเพิ่มบัญชี ${accountName} กรุณาระบุยอดเริ่มต้น`);
					}, 500);
					return true;
				}
				
				// เพิ่มหมวดหมู่
				if (lowerText.match(/^(เพิ่ม|สร้าง)หมวดหมู่\s*(.+)/)) {
					showPage('page-settings');
					const categoryName = text.replace(/^(เพิ่ม|สร้าง)หมวดหมู่\s*/i, '');
					setTimeout(() => {
						const categorySection = document.getElementById('category-settings');
						if (categorySection && categorySection.classList.contains('hidden')) {
							document.querySelector('[data-target="category-settings"]').click();
						}
						document.getElementById('new-category-name').value = categoryName;
						document.getElementById('new-category-name').focus();
						speak(`เตรียมเพิ่มหมวดหมู่ ${categoryName} กรุณาเลือกสีและประเภท`);
					}, 500);
					return true;
				}
				
				return false;
			}

			// ===== ฟังก์ชันค้นหาอัจฉริยะ =====
			function handleSmartSearch(text, lowerText) {
				// ค้นหาทั่วไป
				const searchMatch = lowerText.match(/^(ค้นหา|หา|search|filter|กรอง|ดู)\s+(.+)/);
				if (searchMatch) {
					const keyword = searchMatch[2].trim();
					showPage('page-list');
					
					setTimeout(() => {
						// ค้นหาหลายช่อง
						const searchInput = document.getElementById('adv-filter-search') || 
										  document.querySelector('input[type="search"]') ||
										  document.querySelector('input[placeholder*="ค้นหา"]');
						
						if (searchInput) {
							searchInput.value = keyword;
							searchInput.focus();
							
							// สร้างและส่ง event input
							const event = new Event('input', { bubbles: true });
							searchInput.dispatchEvent(event);
							
							// สร้างและส่ง event change
							const changeEvent = new Event('change', { bubbles: true });
							searchInput.dispatchEvent(changeEvent);
							
							// พูดผลลัพธ์
							setTimeout(() => {
								const results = document.querySelectorAll('.transaction-item, .list-item');
								speak(`พบ ${results.length} รายการที่ตรงกับ "${keyword}"`);
							}, 800);
						}
					}, 300);
					return true;
				}
				
				// ค้นหาเฉพาะ
				if (lowerText.match(/^(รายจ่าย|จ่าย|เสีย|outcome|expense)/)) {
					filterByType('expense');
					speak("แสดงรายจ่ายทั้งหมด");
					return true;
				}
				
				if (lowerText.match(/^(รายรับ|รับ|ได้|income|revenue)/)) {
					filterByType('income');
					speak("แสดงรายรับทั้งหมด");
					return true;
				}
				
				// ค้นหาตามช่วงเวลา
				const timeMatch = lowerText.match(/(วันนี้|เมื่อวาน|สัปดาห์นี้|เดือนนี้|ปีนี้|7วัน|30วัน)/);
				if (timeMatch) {
					applyTimeFilter(timeMatch[1]);
					speak(`แสดงข้อมูล${timeMatch[1]}`);
					return true;
				}
				
				return false;
			}

			// ===== ฟังก์ชันตั้งค่าอัจฉริยะ =====
			function handleSmartSettings(text, lowerText) {
				// เปลี่ยนธีม
				if (lowerText.match(/^(โหมดมืด|dark|ดำ|night)/)) {
					document.getElementById('toggle-dark-mode').click();
					speak("เปลี่ยนเป็นโหมดมืดแล้ว");
					return true;
				}
				
				if (lowerText.match(/^(โหมดสว่าง|light|ขาว|day)/)) {
					document.getElementById('toggle-dark-mode').click();
					speak("เปลี่ยนเป็นโหมดสว่างแล้ว");
					return true;
				}
				
				// เปลี่ยนภาษา
				if (lowerText.match(/^(ภาษาไทย|ไทย|thai)/)) {
					setLanguage('th');
					speak("เปลี่ยนภาษาเป็นไทยแล้ว");
					return true;
				}
				
				if (lowerText.match(/^(ภาษาอังกฤษ|อังกฤษ|english)/)) {
					setLanguage('en');
					speak("เปลี่ยนภาษาเป็นอังกฤษแล้ว");
					return true;
				}
				
				// ควบคุมเสียง
				if (lowerText.match(/^(เสียงเปิด|พูด|เสียง|voice on)/)) {
					localStorage.setItem('voiceEnabled', 'true');
					speak("เปิดเสียงพูดแล้ว");
					return true;
				}
				
				if (lowerText.match(/^(เสียงปิด|เงียบ|mute|silent)/)) {
					localStorage.setItem('voiceEnabled', 'false');
					speak("ปิดเสียงพูดแล้ว");
					return true;
				}
				
				// สำรองข้อมูล
				if (lowerText.match(/^(สำรอง|backup|export|เก็บ)/)) {
					exportBackup();
					speak("กำลังสำรองข้อมูล กรุณารอสักครู่");
					return true;
				}
				
				// นำเข้าข้อมูล
				if (lowerText.match(/^(กู้คืน|restore|import|นำเข้า)/)) {
					document.getElementById('restore-backup').click();
					speak("เตรียมนำเข้าข้อมูล กรุณาเลือกไฟล์");
					return true;
				}
				
				return false;
			}

			// ===== ฟังก์ชันตรวจจับธุรกรรมอัตโนมัติ =====
			function handleTransactionDetection(text, lowerText) {
				// ตรวจจับรูปแบบเงิน
				const amountMatch = text.match(/(\d[\d,]*\.?\d*)\s*(บาท|฿|baht|bath)?/);
				if (!amountMatch) return false;
				
				const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
				
				// ตรวจจับประเภท
				const isExpense = lowerText.match(/(จ่าย|ซื้อ|ค่า|ชำระ|เสีย|โอนออก|ให้|ส่ง|transfer|pay)/);
				const isIncome = lowerText.match(/(รับ|ได้|เงินเดือน|โอนเข้า|เบิก|withdraw|income)/);
				
				// ตรวจจับหมวดหมู่
				let category = detectCategory(text);
				
				// ตรวจจับวันที่
				let date = detectDate(text);
				
				// เปิดฟอร์ม
				openModal();
				
				// กรอกข้อมูลอัตโนมัติ
				setTimeout(() => {
					if (isExpense) {
						document.getElementById('type-expense').checked = true;
					} else if (isIncome) {
						document.getElementById('type-income').checked = true;
					}
					
					document.getElementById('amount').value = amount;
					
					// ตั้งค่าหมวดหมู่ถ้าตรวจพบ
					if (category) {
						const categorySelect = document.getElementById('category');
						if (categorySelect) {
							for (let i = 0; i < categorySelect.options.length; i++) {
								if (categorySelect.options[i].text.toLowerCase().includes(category)) {
									categorySelect.selectedIndex = i;
									break;
								}
							}
						}
					}
					
					// ตั้งค่าวันที่
					if (date) {
						document.getElementById('date').value = date;
					}
					
					// ดึงรายละเอียด
					let note = text
						.replace(amountMatch[0], '')
						.replace(/(จ่าย|ซื้อ|ค่า|รับ|ได้|โอน|ให้|ส่ง)/g, '')
						.trim();
					
					if (note) {
						document.getElementById('note').value = note;
					}
					
					speak(`เตรียมบันทึกรายการ ${isExpense ? 'รายจ่าย' : 'รายรับ'} ${amount} บาท${category ? ` ในหมวดหมู่ ${category}` : ''}`);
					
				}, 300);
				
				return true;
			}

			// ===== ฟังก์ชันช่วยเหลือเมื่อไม่เข้าใจ =====
			function handleFallbackCommand(text) {
				console.warn("ไม่เข้าใจคำสั่ง:", text);
				
				// พยายามเรียนรู้คำสั่งใหม่
				if (text.length > 3) {
					Swal.fire({
						title: 'ไม่เข้าใจคำสั่ง',
						text: `"${text}"\n\nคุณต้องการทำอะไรกับคำสั่งนี้?`,
						icon: 'question',
						showCancelButton: true,
						confirmButtonText: 'เพิ่มรายการ',
						cancelButtonText: 'ค้นหา',
						showDenyButton: true,
						denyButtonText: 'บันทึกโน้ต',
						buttonsStyling: false,
						customClass: {
							confirmButton: 'btn btn-success',
							cancelButton: 'btn btn-info',
							denyButton: 'btn btn-secondary'
						}
					}).then((result) => {
						if (result.isConfirmed) {
							// เพิ่มเป็นรายการ
							openModal();
							setTimeout(() => {
								document.getElementById('note').value = text;
								document.getElementById('note').focus();
							}, 300);
						} else if (result.isDenied) {
							// เพิ่มเป็นโน้ต
							openQuickDraftModal();
							setTimeout(() => {
								document.getElementById('draft-note').value = text;
							}, 300);
						} else if (result.dismiss === Swal.DismissReason.cancel) {
							// ค้นหา
							showPage('page-list');
							setTimeout(() => {
								const searchInput = document.getElementById('adv-filter-search');
								if (searchInput) {
									searchInput.value = text;
									searchInput.dispatchEvent(new Event('input'));
								}
							}, 300);
						}
					});
				} else {
					showToast('ไม่เข้าใจคำสั่ง: ' + text, 'info');
					speak('ขอโทษค่ะ ไม่เข้าใจคำสั่ง กรุณาพูดใหม่อีกครั้ง');
				}
			}

			// ===== ฟังก์ชันตรวจจับหมวดหมู่ =====
			function detectCategory(text) {
				const categories = {
					'อาหาร': ['ข้าว', 'อาหาร', 'กิน', 'ร้าน', 'อาหาร', 'น้ำ', 'เครื่องดื่ม', 'กาแฟ'],
					'เดินทาง': ['รถ', 'น้ำมัน', 'แท็กซี่', 'รถเมล์', 'บีทีเอส', 'เอ็มอาร์ที', 'ทางด่วน'],
					'ช้อปปิ้ง': ['ซื้อ', 'ช้อป', 'ของ', 'สินค้า', 'ออนไลน์', 'ลาซาด้า', 'ช้อปปี้'],
					'บันเทิง': ['หนัง', 'คอนเสิร์ต', 'เที่ยว', 'เล่น', 'เกม', 'เน็ต', 'อินเทอร์เน็ต'],
					'การศึกษา': ['หนังสือ', 'เรียน', 'คอร์ส', 'ติว', 'การศึกษา'],
					'สุขภาพ': ['หมอ', 'ยา', 'โรงพยาบาล', 'ตรวจ', 'สุขภาพ', 'ออกกำลังกาย'],
					'บิล': ['ค่าไฟ', 'ค่าน้ำ', 'อินเทอร์เน็ต', 'โทรศัพท์', 'บิล', 'ค่าใช้จ่าย'],
					'เงินเดือน': ['เงินเดือน', 'รายได้', 'ค่าจ้าง', 'งาน'],
					'โอน': ['โอน', 'ส่ง', 'ให้', 'รับ']
				};
				
				const lowerText = text.toLowerCase();
				for (const [category, keywords] of Object.entries(categories)) {
					for (const keyword of keywords) {
						if (lowerText.includes(keyword)) {
							return category;
						}
					}
				}
				
				return null;
			}

			// ===== ฟังก์ชันตรวจจับวันที่ =====
			function detectDate(text) {
				const today = new Date();
				const tomorrow = new Date(today);
				tomorrow.setDate(tomorrow.getDate() + 1);
				
				const yesterday = new Date(today);
				yesterday.setDate(yesterday.getDate() - 1);
				
				const formatDate = (date) => date.toISOString().split('T')[0];
				
				if (text.match(/(วันนี้|today|now)/i)) {
					return formatDate(today);
				}
				
				if (text.match(/(พรุ่งนี้|tomorrow)/i)) {
					return formatDate(tomorrow);
				}
				
				if (text.match(/(เมื่อวาน|yesterday)/i)) {
					return formatDate(yesterday);
				}
				
				// พยายามตรวจจับวันที่ไทย
				const thaiDateMatch = text.match(/(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{2,4})/);
				if (thaiDateMatch) {
					let [_, day, month, year] = thaiDateMatch;
					year = year.length === 2 ? `25${year}` : year;
					return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
				}
				
				return formatDate(today); // ค่าเริ่มต้นเป็นวันนี้
			}

			// ===== ฟังก์ชันปิดทุกอย่าง =====
			function closeEverything() {
				// ปิด modal ทั้งหมด
				if (typeof closeModal === 'function') closeModal();
				if (typeof closeRecurringModal === 'function') closeRecurringModal();
				if (typeof closeQuickDraftModal === 'function') closeQuickDraftModal();
				
				// ปิด Swal
				if (typeof Swal !== 'undefined') {
					Swal.close();
				}
				
				// ซ่อน dropdown ทั้งหมด
				document.querySelectorAll('.dropdown-content').forEach(el => {
					el.classList.add('hidden');
				});
			}

			// ===== ฟังก์ชันคลิกปุ่มบันทึก =====
			function clickSaveButton() {
				let saved = false;
				
				// ลองหาปุ่มบันทึกในลำดับความสำคัญ
				const saveButtons = [
					document.querySelector('#transaction-form button[type="submit"]'),
					document.getElementById('btn-save-custom-notify'),
					document.querySelector('.swal2-confirm'),
					document.querySelector('.btn-save'),
					document.querySelector('.btn-confirm'),
					document.querySelector('button[type="submit"]:not([disabled])')
				];
				
				for (const btn of saveButtons) {
					if (btn && !btn.disabled && window.getComputedStyle(btn).display !== 'none') {
						btn.click();
						saved = true;
						break;
					}
				}
				
				return saved;
			}

			// ===== ฟังก์ชันกรองตามประเภท =====
			function filterByType(type) {
				showPage('page-list');
				setTimeout(() => {
					const typeFilter = document.getElementById('filter-type');
					if (typeFilter) {
						typeFilter.value = type;
						typeFilter.dispatchEvent(new Event('change'));
					}
				}, 300);
			}

			// ===== ฟังก์ชันกรองตามเวลา =====
			function applyTimeFilter(timePeriod) {
				showPage('page-list');
				setTimeout(() => {
					const periodMap = {
						'วันนี้': 'today',
						'เมื่อวาน': 'yesterday',
						'สัปดาห์นี้': 'this_week',
						'เดือนนี้': 'this_month',
						'ปีนี้': 'this_year',
						'7วัน': 'last_7_days',
						'30วัน': 'last_30_days'
					};
					
					const timeFilter = document.getElementById('filter-period');
					if (timeFilter && periodMap[timePeriod]) {
						timeFilter.value = periodMap[timePeriod];
						timeFilter.dispatchEvent(new Event('change'));
					}
				}, 300);
			}

			// ===== ฟังก์ชันพูด =====
			function speak(text) {
				if (localStorage.getItem('voiceEnabled') !== 'false' && 'speechSynthesis' in window) {
					const utterance = new SpeechSynthesisUtterance(text);
					utterance.lang = 'th-TH';
					utterance.rate = 1.0;
					utterance.pitch = 1.0;
					window.speechSynthesis.speak(utterance);
				}
			}
			

        });