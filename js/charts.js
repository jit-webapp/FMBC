// ไฟล์: js/charts.js
// วาดกราฟและแผนภูมิต่างๆ

// ========================================
// PIE CHART
// ========================================
    function renderPieChart(transactions) {
        // [แก้ไข] กำหนดวันปัจจุบัน (สิ้นสุดวัน)
		const today = new Date();
		today.setHours(23, 59, 59, 999);

		const summary = transactions.reduce((acc, tx) => {
			// [แก้ไข] กรองรายการอนาคตออก
			if (new Date(tx.date) > today) {
				return acc;
			}

			if (tx.type === 'income') {
				acc.income += tx.amount;
			} else if (tx.type === 'expense') {
				acc.expense += tx.amount;
			}
			return acc;
		}, { income: 0, expense: 0 });

        const labels = [
            `รายรับ (${formatCurrency(summary.income)})`, 
            `รายจ่าย (${formatCurrency(summary.expense)})`
        ];
        
        const data = [summary.income, summary.expense];
        if (myChart) {
            myChart.destroy();
        }
        
        const noDataEl = document.getElementById('chart-no-data');
        if (summary.income === 0 && summary.expense === 0) {
            noDataEl.textContent = 'ไม่มีข้อมูล';
            noDataEl.classList.remove('hidden');
            return;
        } else {
            noDataEl.classList.add('hidden');
        }

        const ctx = document.getElementById('transaction-chart').getContext('2d');
        
        const isMobile = window.innerWidth < 768;
        const textColor = state.isDarkMode ? '#e5e7eb' : '#4b5563'; 

        myChart = new Chart(ctx, {
            type: 'pie',
            plugins: [typeof ChartDataLabels !== 'undefined' ? ChartDataLabels : {}], 
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#22c55e', '#ef4444'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        left: isMobile ? 0 : 0,
                        right: isMobile ? 0 : 0,
                        top: isMobile ? 0 : 0,
                        bottom: isMobile ? 0 : 0
                    }
                },
                plugins: {
                    datalabels: {
                        display: false, 
                    },
                    legend: {
                        position: 'right',
                        align: 'center', 
                        labels: {
                            usePointStyle: true, 
                            boxWidth: isMobile ? 8 : 10,
                            padding: isMobile ? 6 : 10,
                            font: {
                                family: 'Prompt, sans-serif',
                                size: isMobile ? 10 : 12,
                                color: textColor 
                            }
                         }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ''; 
                            },
                            title: function(context) {
                                return context[0].label;
                            }
                        }
                    }
                }
            }
        });
    }



// ========================================
// EXPENSE BY NAME CHART
// ========================================
    function renderExpenseByNameChart(transactions) {
		
		const today = new Date();
		today.setHours(23, 59, 59, 999);

		// [แก้ไข] กรองเอาเฉพาะ 'expense' และ วันที่ต้องไม่เกินวันนี้
		const expenseTransactions = transactions.filter(tx => {
			return tx.type === 'expense' && new Date(tx.date) <= today;
		});
		
		const itemData = expenseTransactions.reduce((acc, tx) => {
			const name = tx.name || 'ไม่ระบุรายการ';
			if (!acc[name]) {
				acc[name] = 0;
			}
			acc[name] += tx.amount;
			return acc;
		}, {});
		let sortedItems = Object.entries(itemData).map(([name, amount]) => ({ name, amount }));
		sortedItems.sort((a, b) => b.amount - a.amount);

		const TOP_N = 9;
		let labels = [];
		let data = [];
		
		if (sortedItems.length > (TOP_N + 1)) { 
			const topItems = sortedItems.slice(0, TOP_N);
			const otherItems = sortedItems.slice(TOP_N);
			
			topItems.forEach(item => {
				labels.push(`${item.name} (${formatCurrency(item.amount)})`);
				data.push(item.amount);
			});
			const otherAmount = otherItems.reduce((sum, item) => sum + item.amount, 0);
			labels.push(`อื่นๆ (${formatCurrency(otherAmount)})`);
			data.push(otherAmount);
		} else {
			sortedItems.forEach(item => {
				labels.push(`${item.name} (${formatCurrency(item.amount)})`);
				data.push(item.amount);
			});
		}

		if (myExpenseByNameChart) { 
			myExpenseByNameChart.destroy();
		}
		
		const noDataEl = document.getElementById('expense-chart-no-data');
		if (data.length === 0) {
			noDataEl.classList.remove('hidden');
			return;
		} else {
			noDataEl.classList.add('hidden');
		}

		const generateColors = (numColors) => {
			let colors = [];
			const colorPalette = ['#e11d48', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#3b82f6', '#059669', '#0e7490', '#db2777', '#ca8a04', '#6d28d9', '#64748b'];
			for (let i = 0; i < numColors; i++) {
				colors.push(colorPalette[i % colorPalette.length]);
			}
			return colors;
		};

		const ctx = document.getElementById('expense-category-chart').getContext('2d');
		
		const isMobile = window.innerWidth < 768; 
		const textColor = state.isDarkMode ? '#e5e7eb' : '#4b5563'; 

		myExpenseByNameChart = new Chart(ctx, { 
			type: 'pie', 
			plugins: [typeof ChartDataLabels !== 'undefined' ? ChartDataLabels : {}],
			data: {
				labels: labels,
				datasets: [{
					data: data,
					backgroundColor: generateColors(labels.length),
					borderWidth: 1
				}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					layout: {
						padding: {
							left: isMobile ? 0 : 0,
							right: isMobile ? 0 : 0,
							top: isMobile ? 0 : 0,
							bottom: isMobile ? 0 : 0
						}
					},
					plugins: {
						datalabels: {
							display: false, 
						},
						legend: {
							position: 'right',
							align: 'center', 
							labels: {
								usePointStyle: true, 
								boxWidth: isMobile ? 8 : 10, 
								padding: isMobile ? 6 : 10,  
								font: {
									family: 'Prompt, sans-serif',
									size: isMobile ? 10 : 12, 
									color: textColor 
								}
							}
						},
						tooltip: {
							callbacks: {
								label: function(context) {
									 return ''; 
								},
								title: function(context) {
									return context[0].label;
								}
							}
						}
					}
				}
			});
    }



// ========================================
// BAR CHART
// ========================================
    function renderListPageBarChart(transactions) {
		const ctx = document.getElementById('list-page-bar-chart').getContext('2d');
		const noDataEl = document.getElementById('list-chart-no-data');
		const titleEl = document.getElementById('list-chart-title');
		
		// [แก้ไข] กำหนดวันปัจจุบัน (สิ้นสุดวัน 23:59:59)
		// เพื่อให้ครอบคลุมรายการที่ลงเวลาเป็นวันนี้ทั้งหมด แต่ไม่รวมพรุ่งนี้
		const today = new Date();
		today.setHours(23, 59, 59, 999);

		if (myListPageBarChart) {
			myListPageBarChart.destroy();
		}

		let labels = [];
		let datasets = [];
		let hasData = false;
		let chartType = 'bar'; 

		if (state.listChartMode === 'trend_month' || state.listChartMode === 'trend_year') {
			chartType = 'line';
			const granularity = state.listChartMode === 'trend_month' ? 'month' : 'year';
			titleEl.textContent = granularity === 'month' ? 'แนวโน้ม รายรับ-รายจ่าย รายเดือน' : 'แนวโน้ม รายรับ-รายจ่าย รายปี';
			
			const trendData = transactions.reduce((acc, tx) => {
				// [แก้ไข] กรองรายการอนาคตออก
				if (new Date(tx.date) > today) {
					return acc;
				}

				const dateObj = new Date(tx.date);
				let key;
				if (granularity === 'month') {
					key = dateObj.getFullYear() + '-' + (dateObj.getMonth() + 1).toString().padStart(2, '0');
				} else { // year
					key = dateObj.getFullYear().toString();
				}

				if (!acc[key]) acc[key] = { income: 0, expense: 0 };
				
				if (tx.type === 'income') acc[key].income += tx.amount;
				else if (tx.type === 'expense') acc[key].expense += tx.amount;
				
				return acc;
			}, {});
			
			const sortedKeys = Object.keys(trendData).sort();
			if (sortedKeys.length > 0) {
				hasData = true;
				labels = sortedKeys.map(key => {
					if (granularity === 'month') {
						const [y, m] = key.split('-');
						return new Date(y, m - 1).toLocaleDateString('th-TH', { month: 'short', year: 'numeric' });
					}
					return key; // year
				});
				
				datasets = [
					{
						label: 'รายรับ',
						data: sortedKeys.map(k => trendData[k].income),
						borderColor: '#22c55e',
						backgroundColor: '#22c55e',
						tension: 0.1
					},
					{
						label: 'รายจ่าย',
						data: sortedKeys.map(k => trendData[k].expense),
						borderColor: '#ef4444',
						backgroundColor: '#ef4444',
						tension: 0.1
					}
				];
			}

		} else {
			// Daily (Default)
			titleEl.textContent = 'รายรับ-รายจ่าย 7 วันล่าสุด';
			const last7Days = {};
			
			for (let i = 6; i >= 0; i--) {
				const d = new Date();
				d.setDate(d.getDate() - i);
				const key = d.toISOString().split('T')[0];
				last7Days[key] = { income: 0, expense: 0, dateObj: d };
			}

			transactions.forEach(tx => {
				// [แก้ไข] กรองรายการอนาคตออก
				if (new Date(tx.date) > today) {
					return;
				}

				const key = tx.date.split('T')[0];
				if (last7Days[key]) {
					if (tx.type === 'income') last7Days[key].income += tx.amount;
					else if (tx.type === 'expense') last7Days[key].expense += tx.amount;
				}
			});

			labels = Object.values(last7Days).map(val => val.dateObj.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric' }));
			const incomeData = Object.values(last7Days).map(val => val.income);
			const expenseData = Object.values(last7Days).map(val => val.expense);
			
			if (incomeData.some(v => v > 0) || expenseData.some(v => v > 0)) {
				hasData = true;
			}

			datasets = [
				{
					label: 'รายรับ',
					data: incomeData,
					backgroundColor: '#22c55e'
				},
				{
					label: 'รายจ่าย',
					data: expenseData,
					backgroundColor: '#ef4444'
				}
			];
		}
		
		if (!hasData) {
			noDataEl.classList.remove('hidden');
			return; 
		} else {
			noDataEl.classList.add('hidden');
		}

		const isMobile = window.innerWidth < 768;
		const textColor = state.isDarkMode ? '#e5e7eb' : '#4b5563'; 

		myListPageBarChart = new Chart(ctx, {
			type: chartType,
			plugins: [typeof ChartDataLabels !== 'undefined' ? ChartDataLabels : {}],
			data: {
				labels: labels,
				datasets: datasets
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				layout: {
					padding: {
						left: 0,
						right: 0,
						top: 20,
						bottom: 0
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							font: { family: 'Prompt, sans-serif' },
							color: textColor,
							callback: function(value) {
								 if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
								 return value;
							}
						},
						 grid: {
							color: state.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
						}
					},
					x: {
						ticks: {
							font: { family: 'Prompt, sans-serif', size: 10 },
							color: textColor
						},
						grid: {
							display: false
						}
					}
				},
				plugins: {
					datalabels: {
						display: false, 
					},
					legend: {
						display: true,
						position: 'top',
						labels: {
							usePointStyle: true,
							boxWidth: 8,
							font: { family: 'Prompt, sans-serif', size: 12, color: textColor }
						}
					},
					tooltip: {
						callbacks: {
							 label: function(context) {
								let label = context.dataset.label || '';
								if (label) {
									label += ': ';
								}
								if (context.parsed.y !== null) {
									label += formatCurrency(context.parsed.y);
								}
								return label;
							}
						}
					}
				}
			}
		});
	}

    // ==========================================
	// ส่วนจัดการวันสำคัญ (ฉบับอัปเดตปี 2569/2026 ตาม MyHora)
	// ==========================================

	// 1. วันหยุดราชการสำรอง (กรณีดึง Online ไม่ได้ หรือใช้เป็นฐานข้อมูลหลัก)
	const OFFLINE_HOLIDAYS = {
		// 2026 (ปีปัจจุบัน)
		'2026-01-01': 'วันขึ้นปีใหม่',
		'2026-03-03': 'วันมาฆบูชา',
		'2026-04-06': 'วันจักรี',
		'2026-04-13': 'วันสงกรานต์',
		'2026-04-14': 'วันสงกรานต์',
		'2026-04-15': 'วันสงกรานต์',
		'2026-05-01': 'วันแรงงานแห่งชาติ',
		'2026-05-04': 'วันฉัตรมงคล',
		'2026-05-31': 'วันวิสาขบูชา',        // เลื่อนเป็นเดือน 7 (ปีอธิกมาส)
		'2026-06-01': 'ชดเชยวันวิสาขบูชา',
		'2026-06-03': 'วันเฉลิมพระชนมพรรษาพระราชินี',
		'2026-07-28': 'วันเฉลิมพระชนมพรรษา ร.10',
		'2026-07-29': 'วันอาสาฬหบูชา',       // เลื่อนเป็นเดือน 8 หนที่สอง
		'2026-07-30': 'วันเข้าพรรษา',
		'2026-08-12': 'วันแม่แห่งชาติ',
		'2026-10-13': 'วันนวมินทรมหาราช',
		'2026-10-23': 'วันปิยมหาราช',
		'2026-12-05': 'วันพ่อแห่งชาติ',
		'2026-12-10': 'วันรัฐธรรมนูญ',
		'2026-12-31': 'วันสิ้นปี'
	};

	// 2. ฟังก์ชันดึงวันหยุดราชการ (Online + Fallback)
	async function fetchPublicHolidays(year) {
		// ถ้าเป็นปี 2026 ให้ใช้ข้อมูลที่เราเตรียมไว้เลย (แม่นยำกว่า API บางตัว)
		if (year === 2026) return OFFLINE_HOLIDAYS;

		// ปีอื่นๆ ลองดึงจาก API
		if (holidayCache[year]) return holidayCache[year];
		try {
			const response = await fetch(`https://date.nager.at/api/v3/publicholidays/${year}/TH`);
			if (!response.ok) throw new Error('API Connect Failed');
			const data = await response.json();
			const holidays = {};
			data.forEach(item => { holidays[item.date] = item.localName || item.name; });
			holidayCache[year] = holidays;
			return holidays;
		} catch (error) {
			// ถ้าดึงไม่ได้ ให้คืนค่าว่างหรือข้อมูล Offline (ถ้ามี)
			return OFFLINE_HOLIDAYS; 
		}
	}

	// 3. ฟังก์ชันคำนวณวันพระ (ฉบับแก้ไขปี 2569 ตาม MyHora)
	function calculateBuddhistHolyDays(year) {
		const yearNum = parseInt(year);
		
		// ข้อมูลวันพระปี 2569 (2026) - ปีอธิกมาส (มีเดือน 8 สองหน)
		if (yearNum === 2026) {
			return [
				// มกราคม
				'2026-01-03', '2026-01-11', '2026-01-18', '2026-01-26',
				// กุมภาพันธ์
				'2026-02-02', '2026-02-10', '2026-02-16', '2026-02-24',
				// มีนาคม
				'2026-03-03', // มาฆบูชา
				'2026-03-11', '2026-03-18', '2026-03-26',
				// เมษายน
				'2026-04-02', '2026-04-10', '2026-04-16', '2026-04-24',
				// พฤษภาคม
				'2026-05-01', '2026-05-09', '2026-05-16', '2026-05-24', 
				'2026-05-31', // วิสาขบูชา (เดือน 7)
				// มิถุนายน
				'2026-06-08', '2026-06-14', '2026-06-22', '2026-06-29',
				// กรกฎาคม
				'2026-07-07', '2026-07-14', '2026-07-22', 
				'2026-07-29', // อาสาฬหบูชา (เดือน 8-8)
				// สิงหาคม
				'2026-08-06', '2026-08-13', '2026-08-21', '2026-08-28',
				// กันยายน
				'2026-09-05', '2026-09-11', '2026-09-19', '2026-09-26',
				// ตุลาคม
				'2026-10-04', '2026-10-11', '2026-10-19', 
				'2026-10-26', // ออกพรรษา
				// พฤศจิกายน
				'2026-11-03', '2026-11-09', '2026-11-17', 
				'2026-11-24', // ลอยกระทง
				// ธันวาคม
				'2026-12-02', '2026-12-09', '2026-12-17', '2026-12-24'
			];
		} 
		
		// ปี 2025 (เผื่อกดดูย้อนหลัง)
		if (yearNum === 2025) {
			 return [
				'2025-01-06','2025-01-13','2025-01-21','2025-01-28','2025-02-05','2025-02-12','2025-02-20','2025-02-26',
				'2025-03-06','2025-03-13','2025-03-21','2025-03-28','2025-04-05','2025-04-12','2025-04-20','2025-04-26',
				'2025-05-04','2025-05-11','2025-05-19','2025-05-26','2025-06-03','2025-06-10','2025-06-18','2025-06-25',
				'2025-07-03','2025-07-10','2025-07-18','2025-07-25','2025-08-01','2025-08-09','2025-08-16','2025-08-24',
				'2025-08-31','2025-09-07','2025-09-15','2025-09-22','2025-09-30','2025-10-07','2025-10-15','2025-10-22',
				'2025-10-30','2025-11-06','2025-11-14','2025-11-20','2025-11-28','2025-12-05','2025-12-13','2025-12-20','2025-12-28'
			];
		}

		return []; // ปีอื่นๆ คืนค่าว่าง (หรือจะเขียนสูตรคำนวณเพิ่มก็ได้)
	}

	// 3. ฟังก์ชัน Render ปฏิทิน (อัปเดตใหม่)
	// ============================================
	// 1. ฟังก์ชันแสดงปฏิทิน (เรียกใช้ showDailyDetails)
	// ============================================
