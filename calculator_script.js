// ========== local storage ==========
let savedReceipts = JSON.parse(localStorage.getItem('studentReceipts')) || [];
let isNightMode = localStorage.getItem('nightMode') === 'true';
let isDetailedStats = false; // ZMIANA: zawsze false przy ładowaniu

// funkcja do rejestrowania starych paragonów bez ID
function fixOldReceipts() {
    let needsFix = false;
    savedReceipts = savedReceipts.map(receipt => {
        if (!receipt.id) {
            receipt.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            needsFix = true;
        }
        return receipt;
    });
    
    if (needsFix) {
        localStorage.setItem('studentReceipts', JSON.stringify(savedReceipts));
    }
}

// odpala tą funkcię
fixOldReceipts();

// ========== tryb nocny ==========
function toggleNightMode() {
    isNightMode = !isNightMode;
    localStorage.setItem('nightMode', isNightMode);
    applyNightMode();
    
    const switchInput = document.querySelector('#nightModeSwitch');
    if (switchInput) {
        switchInput.checked = isNightMode;
    }
}

function applyNightMode() {
    if (isNightMode) {
        document.body.classList.add('night-mode');
    } else {
        document.body.classList.remove('night-mode');
    }
}

// ========== RADCA FUNCTIONALITY ==========
function showRadca(totalAmount, userAnswers) {
    const radcaElement = document.getElementById('radca');
    if (!radcaElement) return;
    
    let colorClass = '';
    let message = '';
    let tips = '';

    if (totalAmount <= 1500) {
        colorClass = 'radca-green';
        message = '🎉 <strong>Gratulacje!</strong> Świetnie zarządzasz swoim budżetem! Jesteś mistrzem oszczędzania – tak trzymaj!';
    } else if (totalAmount <= 2500) {
        colorClass = 'radca-yellow';
        message = '💡 <strong>Nieźle, ale może być lepiej!</strong>';
        
        // Spersonalizowane porady based on odpowiedzi
        const personalizedTips = [];
        
        // Sprawdzamy odpowiedzi użytkownika
        const answerTexts = userAnswers.map(answer => answer.text.toLowerCase());
        
        if (answerTexts.some(text => text.includes('tradycyjne') || text.includes('palić'))) {
            personalizedTips.push('Rzucenie palenia to nie tylko zdrowie, ale i duża oszczędność!');
        }
        if (answerTexts.some(text => text.includes('samochód') || text.includes('auto'))) {
            personalizedTips.push('Częstsze korzystanie z komunikacji miejskiej lub biletu miesięcznego może zmniejszyć koszty transportu.');
        }
        if (answerTexts.some(text => text.includes('kawę') || text.includes('kawę'))) {
            personalizedTips.push('Jedna kawa mniej dziennie = więcej złotówek w portfelu na koniec miesiąca!');
        }
        if (answerTexts.some(text => text.includes('allegro') || text.includes('shein') || text.includes('zakupy'))) {
            personalizedTips.push('Ograniczenie zakupów online tylko do niezbędnych rzeczy to pewny sposób na oszczędności.');
        }
        if (answerTexts.some(text => text.includes('piwo') || text.includes('alkohol'))) {
            personalizedTips.push('Ograniczenie wyjść na piwo może znacząco zmniejszyć miesięczne wydatki.');
        }

        // Domyślne porady jeśli brak spersonalizowanych
        if (personalizedTips.length === 0) {
            personalizedTips.push('Przeanalizuj swoje wydatki na rozrywkę i jedzenie na mieście.');
            personalizedTips.push('Zaplanuj większe zakupy z wyprzedzeniem i szukaj promocji.');
        }

        tips = `<div class="radca-tips">
            <strong>Oto jak możesz zaoszczędzić:</strong>
            <ul>${personalizedTips.map(tip => `<li>${tip}</li>`).join('')}</ul>
        </div>`;
        
    } else {
        colorClass = 'radca-red';
        message = '⚠️ <strong>Uwaga!</strong> Twoje wydatki są dość wysokie. To dobry moment, aby przeanalizować swój budżet i znaleźć obszary do cięć. Czas na finansowy detoks! ';
        
        tips = `<div class="radca-tips">
            <strong>Natychmiastowe działania:</strong>
            <ul>
                <li>Stwórz szczegółowy budżet miesięczny</li>
                <li>Ogranicz niepotrzebne subskrypcje</li>
                <li>Planuj posiłki i zakupy spożywcze</li>
                <li>Szukaj darmowych alternatyw rozrywki</li>
            </ul>
        </div>`;
    }

    // Aktualizuj zawartość radcy
    radcaElement.className = `radca-container ${colorClass} show`;
    radcaElement.innerHTML = `
        <div class="radca-content">
            ${message}
            ${tips}
        </div>
    `;
}

// ========== wykres ==========
function toggleDetailedStats() {
    isDetailedStats = !isDetailedStats;
    

    const switchInput = document.querySelector('#statsSwitch');
    if (switchInput) {
        switchInput.checked = isDetailedStats;
    }
    
    // jeśli statystyki są włączone i znajdujemy się w sekcji profilu -> wyświetlamy wykres
    if (isDetailedStats && document.getElementById('profil').classList.contains('active')) {
        showStatisticsChart();
    } else {
        // jeśli statystyki są wyłączone -> pokazujemy komunikat
        const statsContainer = document.querySelector('.statistics-chart-container');
        if (statsContainer) {
            statsContainer.innerHTML = '<p class="stats-disabled">Statystyki szczegółowe są wyłączone. Włącz przełącznik, aby zobaczyć wykres.</p>';
        }
    }
}

// ========== wyświetlanie wykresu ==========
// kiedy ma i nie ma danych
function showStatisticsChart() {
    if (!isDetailedStats) return;
    
    const statsContainer = document.querySelector('.statistics-chart-container');
    if (!statsContainer) return;
    
    if (savedReceipts.length === 0) {
        statsContainer.innerHTML = `
            <div class="no-statistics">
                <i class="fa-solid fa-chart-line"></i>
                <h3>Brak danych do statystyk</h3>
                <p>Wykonaj testy, aby zobaczyć tutaj wykres swoich wydatków!</p>
            </div>
        `;
        return;
    }
    
    // dane dla wykresu
    const chartData = savedReceipts.map((receipt, index) => ({
        testNumber: index + 1,
        cost: receipt.total || 0,
        date: receipt.date || 'Nieznana data'
    }));
    
    statsContainer.innerHTML = `
        <div class="chart-container">
            <h3>Statystyki Twoich Wydatków</h3>
            <div class="chart">
                ${generateChartBars(chartData)}
            </div>
        </div>
    `;
}

function generateChartBars(data) {
    if (data.length === 0) return '';
    
    const maxCost = Math.max(...data.map(item => item.cost));
    const maxHeight = 150; // maks wysokość słupka
    
    return data.map(item => {
        const height = maxCost > 0 ? (item.cost / maxCost) * maxHeight : 0;
        return `
            <div class="chart-bar-container">
                <div class="chart-bar" style="height: ${height}px" title="Test ${item.testNumber}: ${item.cost} zł">
                    <span class="bar-value">${item.cost}</span>
                </div>
                <div class="bar-label">${item.testNumber}</div>
            </div>
        `;
    }).join('');
}

function showReceipt() {
    console.log('Funkcja showReceipt wywołana');
    
    // czy jest już taki paragon
    const existingReceiptIndex = savedReceipts.findIndex(receipt => 
        receipt.total === totalCost && 
        JSON.stringify(receipt.answers) === JSON.stringify(answers)
    );

    if (existingReceiptIndex === -1) {
        // tworzymy nowy paragon TYLKO jeśli go jeszcze nie ma
        const currentReceipt = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            date: new Date().toLocaleString("pl-PL"),
            answers: [...answers],
            total: totalCost
        };

        console.log('Nowy paragon:', currentReceipt);

        // zapisujemy paragon do local storage
        savedReceipts.push(currentReceipt);
        localStorage.setItem('studentReceipts', JSON.stringify(savedReceipts));

        console.log('Paragon zapisany, teraz paragony:', savedReceipts);
        
        // POKAZUJEMY RADCA PO ZAPISANIU NOWEGO PARAGONU
        setTimeout(() => {
            showRadca(totalCost, answers);
        }, 500);
        
    } else {
        console.log('Paragon już istnieje, pomijamy duplikowanie');
    }

    showAllReceipts();
}

// ========== wyświetlanie wszystkich paragonów ==========
function showAllReceipts() {
    console.log('Funkcja showAllReceipts wywołana');
    
    const receiptsContainer = document.getElementById('receiptsContainer');
    console.log('receiptsContainer:', receiptsContainer);
    
    if (!receiptsContainer) {
        console.error('receiptsContainer nie znaleziono!');
        return;
    }
    
    if (savedReceipts.length === 0) {
        console.log('Brak paragonów do wyświetlenia');
        receiptsContainer.innerHTML = `
            <div class="no-receipts">
                <i class="fa-solid fa-receipt"></i>
                <h3>Jeszcze nie masz paragonów</h3>
                <p>Wykonaj test, aby zobaczyć tutaj swój pierwszy paragon!</p>
                <button class="start-btn" onclick="showSection('test'); setTimeout(initTest, 300);">
                    Wykonaj test
                </button>
            </div>
        `;
        
        // Ukrywamy Radca gdy nie ma paragonów
        const radcaElement = document.getElementById('radca');
        if (radcaElement) {
            radcaElement.style.display = 'none';
        }
        
        return;
    }

    console.log('Wyświetlamy paragony:', savedReceipts.length);

    // POKAZUJEMY RADCA DLA NAJNOWSZEGO PARAGONU
    if (savedReceipts.length > 0) {
        const latestReceipt = savedReceipts[savedReceipts.length - 1];
        setTimeout(() => {
            showRadca(latestReceipt.total, latestReceipt.answers);
        }, 300);
    }

    // overlay do przyciemnienia tła przy kliknięciu na paragon
    if (!document.getElementById('receiptOverlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'receiptOverlay';
        overlay.className = 'receipt-overlay';
        overlay.onclick = closeAllReceipts;
        document.body.appendChild(overlay);
    }

    const receiptsHTML = savedReceipts.map(receipt => {
        const receiptId = receipt.id || 'unknown';
        const shortId = receiptId.length > 6 ? receiptId.substr(-6) : receiptId;
        
        // mini paragon w okienku
        const visibleAnswers = receipt.answers ? receipt.answers.slice(0, 3) : [];
        const totalAnswers = receipt.answers ? receipt.answers.length : 0;
        
        // paragon HTML
        return `
        <div class="compact-receipt collapsed" id="receipt-${receiptId}" onclick="expandReceipt('${receiptId}')">
            <button class="close-receipt" onclick="event.stopPropagation(); closeReceipt('${receiptId}')">
                <i class="fa-solid fa-times"></i>
            </button>
            
            <!-- Uproszczony nagłówek paragonu -->
            <div class="receipt-header">
                <div class="receipt-title">
                    <i class="fa-solid fa-receipt"></i>
                    PARAGON
                </div>
                <div class="receipt-subtitle">Politechnika Lubelska</div>
                <div class="receipt-info">
                    <span>Nr: ${shortId}</span>
                    <span>Studencki</span>
                </div>
            </div>
            
            <div class="receipt-date">${receipt.date || 'Nieznana data'}</div>
            
            <div class="compact-items">
                ${(visibleAnswers || []).map((answer, index) => {
                    const question = questions[index] || { question: 'Nieznane pytanie' };
                    const answerText = answer?.text || 'Brak odpowiedzi';
                    const answerCost = answer?.cost || 0;
                    
                    return `
                    <div class="compact-item">
                        <div class="receipt-question">${question.question}</div>
                        <div class="receipt-answer">
                            <div class="answer-text">${answerText}</div>
                            ${answerCost > 0 ? `<div class="answer-cost">${answerCost} zł</div>` : '<div class="answer-cost">-</div>'}
                        </div>
                    </div>
                    `;
                }).join('')}
                
                ${totalAnswers > 3 ? `
                <div class="compact-item">
                    <div class="receipt-question">... i ${totalAnswers - 3} więcej pozycji</div>
                    <div class="receipt-answer">
                        <div class="answer-text">Kliknij aby zobaczyć więcej</div>
                        <div class="answer-cost"></div>
                    </div>
                </div>
                ` : ''}
            </div>
            
            <div class="receipt-divider">──────────────</div>
            
            <div class="compact-total">
                <div class="total-row">
                    <span>SUMA:</span>
                    <span class="total-amount">${receipt.total || 0} zł</span>
                </div>
                <div class="total-note">Szacowany miesięczny koszt utrzymania</div>
            </div>
            
            <div class="expand-indicator">
                <i class="fa-solid fa-chevron-down"></i> Kliknij aby rozwinąć
            </div>
            
            <!-- Pełna zawartość (ukryta w widoku kompaktowym) -->
            <div class="full-content" style="display: none;">
                <div class="compact-items">
                    ${(receipt.answers || []).map((answer, index) => {
                        const question = questions[index] || { question: 'Nieznane pytanie' };
                        const answerText = answer?.text || 'Brak odpowiedzi';
                        const answerCost = answer?.cost || 0;
                        
                        return `
                        <div class="compact-item">
                            <div class="receipt-question">${question.question}</div>
                            <div class="receipt-answer">
                                <div class="answer-text">${answerText}</div>
                                ${answerCost > 0 ? `<div class="answer-cost">${answerCost} zł</div>` : '<div class="answer-cost">-</div>'}
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div> 
                
                <div class="receipt-divider">──────────────</div>
                
                <div class="compact-total">
                    <div class="total-row">
                        <span>SUMA:</span>
                        <span class="total-amount">${receipt.total || 0} zł</span>
                    </div>
                    <div class="total-note">Miesięczny koszt utrzymania</div>
                </div>
                
                <div class="receipt-footer">
                    <div class="footer-text">
                        <i class="fa-solid fa-university"></i>
                        Politechnika Lubelska<br>
                        <small>Kalkulator Życia Studenckiego</small>
                    </div>
                </div>
                
                <div class="receipt-actions">
                    <button class="delete-single-btn" onclick="event.stopPropagation(); deleteSingleReceipt('${receiptId}')">
                        <i class="fa-solid fa-trash"></i> Usuń paragon
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');

    receiptsContainer.innerHTML = receiptsHTML;
    
    // Dodajemy przyciski zarządzania
    addReceiptsControls();
    
    console.log('Paragony pomyślnie wyświetlone');
}

// Funkcje do rozwijania/zwijania paragonów
function expandReceipt(receiptId) {
    const receipt = document.getElementById(`receipt-${receiptId}`);
    const overlay = document.getElementById('receiptOverlay');
    
    if (receipt && overlay) {
        // Zwijamy wszystkie inne paragony
        document.querySelectorAll('.compact-receipt.expanded').forEach(r => {
            if (r.id !== `receipt-${receiptId}`) {
                closeReceipt(r.id.replace('receipt-', ''));
            }
        });
        
        // Rozwijamy bieżący paragon
        receipt.classList.remove('collapsed');
        receipt.classList.add('expanded');
        overlay.style.display = 'block';
        
        // Pokazujemy pełną zawartość
        const fullContent = receipt.querySelector('.full-content');
        if (fullContent) {
            fullContent.style.display = 'block';
        }
        
        // Ukrywamy wskaźnik rozwijania
        const expandIndicator = receipt.querySelector('.expand-indicator');
        if (expandIndicator) {
            expandIndicator.style.display = 'none';
        }
    }
}

function closeReceipt(receiptId) {
    const receipt = document.getElementById(`receipt-${receiptId}`);
    const overlay = document.getElementById('receiptOverlay');
    
    if (receipt) {
        receipt.classList.remove('expanded');
        receipt.classList.add('collapsed');
        
        // Ukrywamy pełną zawartość
        const fullContent = receipt.querySelector('.full-content');
        if (fullContent) {
            fullContent.style.display = 'none';
        }
        
        // Pokazujemy wskaźnik rozwijania
        const expandIndicator = receipt.querySelector('.expand-indicator');
        if (expandIndicator) {
            expandIndicator.style.display = 'block';
        }
    }
    
    // Sprawdzamy, czy są jeszcze rozwinięte paragony
    const expandedReceipts = document.querySelectorAll('.compact-receipt.expanded');
    if (expandedReceipts.length === 0 && overlay) {
        overlay.style.display = 'none';
    }
}

function closeAllReceipts() {
    document.querySelectorAll('.compact-receipt.expanded').forEach(receipt => {
        const receiptId = receipt.id.replace('receipt-', '');
        closeReceipt(receiptId);
    });
}

function addReceiptsControls() {
    const paragonHeader = document.querySelector('.paragon-header');
    if (paragonHeader && !paragonHeader.querySelector('.receipts-controls')) {
        const controlsHTML = `
            <div class="receipts-controls">
                <button class="start-btn" onclick="showSection('test'); setTimeout(initTest, 300);">
                    <i class="fa-solid fa-plus"></i> Nowy test
                </button>
                <button class="clear-btn" onclick="clearAllReceipts()">
                    <i class="fa-solid fa-broom"></i> Wyczyść wszystkie
                </button>
            </div>
        `;
        paragonHeader.innerHTML += controlsHTML;
    }
}

function deleteSingleReceipt(receiptId) {
    if (confirm('Czy na pewno chcesz usunąć ten paragon?')) {
        // Zamykamy paragon przed usunięciem
        closeReceipt(receiptId);
        
        // Usuwamy z tablicy
        savedReceipts = savedReceipts.filter(receipt => receipt.id !== receiptId);
        localStorage.setItem('studentReceipts', JSON.stringify(savedReceipts));
        
        // Pokazujemy zaktualizowane paragony
        setTimeout(() => {
            showAllReceipts();
        }, 300);
        
        // Aktualizujemy statystyki jeśli są otwarte
        if (isDetailedStats) {
            showStatisticsChart();
        }
    }
}

function clearAllReceipts() {
    if (confirm('Czy na pewno chcesz usunąć WSZYSTKIE paragony? Tej operacji nie można cofnąć.')) {
        savedReceipts = [];
        localStorage.removeItem('studentReceipts');
        showAllReceipts();
        
        // Ukrywamy Radca po wyczyszczeniu wszystkich paragonów
        const radcaElement = document.getElementById('radca');
        if (radcaElement) {
            radcaElement.style.display = 'none';
        }
        
        // Aktualizujemy statystyki jeśli są otwarte
        if (isDetailedStats) {
            showStatisticsChart();
        }
    }
}

// ========== NAWIGACJA ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM załadowany');
    
    // Stosujemy tryb nocny przy ładowaniu
    applyNightMode();
    
    // Nawigacja po menu
    const navLinks = document.querySelectorAll('nav a');
    const sections = document.querySelectorAll('.section');
    const navItems = document.querySelectorAll('nav li');
    
    // Funkcja do przełączania sekcji
    function showSection(sectionId) {
        console.log('Przełączamy na sekcję:', sectionId);
        
        // Ukrywamy wszystkie sekcje
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Pokazujemy potrzebną sekcję
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Jeśli to sekcja paragon - pokazujemy wszystkie paragony
        if (sectionId === 'paragon') {
            console.log('Pokazujemy paragony dla sekcji paragon');
            showAllReceipts();
        }
        
        // Jeśli to sekcja profilu i włączona szczegółowa statystyka - pokazujemy wykres
        if (sectionId === 'profil' && isDetailedStats) {
            setTimeout(showStatisticsChart, 100);
        }
    }
    
    // Obsługi kliknięć dla nawigacji
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            
            // Aktualizujemy aktywny punkt menu
            navItems.forEach(item => item.classList.remove('active'));
            this.parentElement.classList.add('active');
            
            // Pokazujemy sekcję
            showSection(sectionId);
        });
    });
    
    // Przycisk "Rozpocznij Test" na głównej
    const startMainTestBtn = document.getElementById('startMainTest');
    if (startMainTestBtn) {
        startMainTestBtn.addEventListener('click', function() {
            // Aktywujemy punkt menu "Test"
            navItems.forEach(item => item.classList.remove('active'));
            navItems[2].classList.add('active'); // Test jest trzecim elementem
            
            // Pokazujemy sekcję testu
            showSection('test');
            
            // Inicjalizujemy test
            initTest();
        });
    }
    
    // Inicjalizacja sekcji przy ładowaniu
    initializeSections();
});

// ========== INICJALIZACJA SEKCJI ==========
function initializeSections() {
    console.log('Inicjalizacja sekcji');
    
    // Inicjalizujemy sekcję Profil
    const profilSection = document.getElementById('profil');
    if (profilSection) {
        profilSection.querySelector('.container').innerHTML = `
            <div class="profile-container">
                <div class="profile-header">
                    <div class="profile-avatar">
                        <i class="fa-solid fa-user-graduate"></i>
                    </div>
                    <h2>Twój Profil Studenta</h2>
                    <p>Zarządzaj swoimi danymi i osiągnięciami</p>
                </div>
                
                <div class="profile-stats">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fa-solid fa-receipt"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${savedReceipts.length}</h3>
                            <p>Wykonanych testów</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fa-solid fa-coins"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${savedReceipts.length > 0 ? Math.max(...savedReceipts.map(r => r.total || 0)) + ' zł' : '0 zł'}</h3>
                            <p>Najwyższy koszt</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fa-solid fa-calendar"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${new Date().getFullYear()}</h3>
                            <p>Rok akademicki</p>
                        </div>
                    </div>
                </div>
                
                <div class="statistics-chart-container">
                    <p class="stats-disabled">Statystyki szczegółowe są wyłączone. Włącz przełącznik, aby zobaczyć wykres.</p>
                </div>
            </div>
        `;
    }

    // Inicjalizujemy sekcję Kontakt
    const kontaktSection = document.getElementById('kontakt');
    if (kontaktSection) {
        kontaktSection.querySelector('.container').innerHTML = `
            <div class="contact-container">
                <div class="contact-header">
                    <h2>Kontakt</h2>
                    <p class="contact-slogan">Odpisuję szybciej niż dziekanat!</p>
                </div>
                
                <div class="contact-content">
                    <div class="contact-info">
                        <div class="contact-card">
                            <div class="contact-icon instagram">
                                <i class="fa-brands fa-instagram"></i>
                            </div>
                            <div class="contact-details">
                                <h3>Instagram</h3>
                                <a href="https://www.instagram.com" class="contact-link">Obserwuj nas</a>
                            </div>
                        </div>
                        
                        <div class="contact-card">
                            <div class="contact-icon telegram">
                                <i class="fa-brands fa-telegram"></i>
                            </div>
                            <div class="contact-details">
                                <h3>Telegram</h3>
                                <a href="https://web.telegram.org/a/" class="contact-link">Napisz do nas</a>
                            </div>
                        </div>
                        
                        <div class="contact-card">
                            <div class="contact-icon messenger">
                                <i class="fa-brands fa-facebook-messenger"></i>
                            </div>
                            <div class="contact-details">
                                <h3>Messenger</h3>
                                <a href="https://www.messenger.com/" class="contact-link">Rozpocznij czat</a>
                            </div>
                        </div>
                        
                        <div class="contact-card">
                            <div class="contact-icon gmail">
                                <i class="fa-solid fa-envelope"></i>
                            </div>
                            <div class="contact-details">
                                <h3>Gmail</h3>
                                <a href="https://mail.google.com/mail/u/0/" class="contact-link">Wyślij email</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Inicjalizujemy sekcję Ustawienia
    const ustawieniaSection = document.getElementById('ustawienia');
    if (ustawieniaSection) {
        ustawieniaSection.querySelector('.container').innerHTML = `
            <div class="settings-container">
                <h2>Ustawienia</h2>
                <p>Dostosuj aplikację do swoich potrzeb</p>
                
                <div class="settings-grid">
                    <div class="setting-card">
                        <div class="setting-icon">
                            <i class="fa-solid fa-moon"></i>
                        </div>
                        <div class="setting-content">
                            <h3>Tryb ciemny</h3>
                            <p>Zmniejsz zmęczenie oczu wieczorem</p>
                            <label class="switch">
                                <input type="checkbox" id="nightModeSwitch" ${isNightMode ? 'checked' : ''} onchange="toggleNightMode()">
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="setting-card">
                        <div class="setting-icon">
                            <i class="fa-solid fa-chart-pie"></i>
                        </div>
                        <div class="setting-content">
                            <h3>Statystyki szczegółowe</h3>
                            <p>Pokazuj szczegółowe wykresy wydatków</p>
                            <label class="switch">
                                <input type="checkbox" id="statsSwitch" ${isDetailedStats ? 'checked' : ''} onchange="toggleDetailedStats()">
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// ========== DANE TESTU ==========
const questions = [
    { question: "Gdzie mieszkasz?", options: [
        { text: "Akademik", cost: 750 },
        { text: "Pokój", cost: 950 },
        { text: "Z rodzicami", cost: 0 }
    ]},
    { question: "Czy palisz?", options: [
        { text: "Tradycyjne", cost: 600},
        { text: "Elektryczne", cost: 200},
        { text: "Nie palę", cost: 0}
    ]},
    { question: "Słuchasz muzyke?", options: [
        { text: "Spotify(student)", cost: 13},
        { text: "Apple music(student)", cost: 12},
        { text: "Słucham i nie płace", cost: 0}
    ]},
    { question: "Czym dojeżdżasz na uczelnie?", options: [
        { text: "MPK", cost: 64},
        { text: "Samochód", cost: 200},
        { text: "Pieszo", cost: 0}
    ]},
    { question: "Pijesz kawę na uczelni?", options: [
        { text: "Codziennie, bez niej nie żyję", cost: 180 },
        { text: "Kilka razy w tygodniu", cost: 90 },
        { text: "Nie piję kawy", cost: 0 }
    ]},
    { question: "Czy zamawiasz coś z Allegro lub Shein?", options: [
        { text: "Regularnie", cost: 150 },
        { text: "Tylko gdy jest promocja", cost: 80 },
        { text: "Nie, oszczędzam", cost: 0 }
    ]},
    { question: "Kupujesz przekąski podczas nauki?", options: [
        { text: "Tak, zawsze coś chrupię", cost: 120 },
        { text: "Czasami", cost: 60 },
        { text: "Nie, jestem silny psychicznie", cost: 0 }
    ]},
    { question: "Jak często wychodzisz na piwo ze znajomymi?", options: [
        { text: "Co weekend", cost: 160 },
        { text: "Raz w miesiącu", cost: 60 },
        { text: "Nie piję alkoholu", cost: 0 }
    ]},
    { question: "Lubisz seriale?", options: [
        { text: "Tak, Netflix", cost: 50 },
        { text: "Polsat Box Go", cost: 30 },
        { text: "Wolę YouTube", cost: 0}
    ]},
    { question: "Jak często chodzisz na zakupy?", options: [
        { text: "Raz w tygodniu", cost: 500},
        { text: "Student budget edition", cost: 200},
        { text: "Matka gotuje", cost: 0}
    ]}
];

let currentQuestion = 0;
let answers = [];
let totalCost = 0;

// ========== FUNKCJE TESTU ==========
function initTest() {
    console.log('Inicjalizacja testu');
    
    const testSection = document.getElementById('test');
    testSection.innerHTML = `
        <div class="container">
            <div class="test-container">
                <button id="startTest" class="start-btn">
                    Rozpocznij test
                </button>
                <div id="questionBox" class="question-box"></div>
            </div>
        </div>
    `;
    
    document.getElementById('startTest').addEventListener('click', startTest);
}

function startTest() {
    console.log('Początek testu');
    
    currentQuestion = 0;
    answers = [];
    totalCost = 0;
    
    const startBtn = document.getElementById('startTest');
    const questionBox = document.getElementById('questionBox');
    
    // Płynnie ukrywamy przycisk startu
    startBtn.style.opacity = '0';
    startBtn.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
        startBtn.style.display = "none";
        showQuestion();
    }, 300);
}

function showQuestion() {
    console.log('Pokazujemy pytanie:', currentQuestion);
    
    const questionBox = document.getElementById('questionBox');
    const q = questions[currentQuestion];
    
    questionBox.innerHTML = `
        <div class="question-header">
            <h3>${q.question}</h3>
        </div>
        <div class="options">
            ${q.options.map((opt, i) => `
                <button class="option-btn" data-index="${i}" style="animation-delay: ${i * 0.1}s">
                    <span>${opt.text}</span>
                </button>
            `).join('')}
        </div>
    `;
    
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach((btn) => {
        btn.classList.add('fade-in');
        
        btn.addEventListener('click', function() {
            const selectedBtn = this;
            const i = selectedBtn.getAttribute('data-index');
            const option = q.options[i];
            
            // Wizualna informacja zwrotna przy wyborze
            optionButtons.forEach(b => b.classList.remove('selected'));
            selectedBtn.classList.add('selected');
            
            setTimeout(() => {
                answers.push(option);
                totalCost += option.cost;
                currentQuestion++;

                if (currentQuestion < questions.length) {
                    showQuestion();
                } else {
                    showFinal();
                }
            }, 400);
        });
    });
}

function showFinal() {
    console.log('Zakończenie testu, całkowity koszt:', totalCost);
    
    const questionBox = document.getElementById('questionBox');
    
    questionBox.innerHTML = `
        <div class="question-header">
            <h2>Test zakończony!</h2>
            <p>Twój miesięczny koszt życia studenckiego:</p>
            <div style="font-size: 2.5rem; color: #ebd115; margin: 20px 0; font-weight: bold;">
                ${totalCost} zł
            </div>
            <p>Paragon został automatycznie zapisany!</p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
            <button id="goToReceipt" class="start-btn">
                <i class="fa-solid fa-receipt"></i> Zobacz paragony
            </button>
            <button id="restartTest" class="start-btn" style="background: #6c757d; margin-left: 15px;">
                <i class="fa-solid fa-rotate-right"></i> Nowy test
            </button>
        </div>
    `;

    document.getElementById('goToReceipt').addEventListener('click', function() {
        console.log('Klik na przycisk "Zobacz paragony"');
        
        // Aktywujemy punkt menu "Paragon"
        document.querySelectorAll('nav li').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('nav li')[3].classList.add('active');
        
        // Pokazujemy sekcję paragon
        showSection('paragon');
        
        // Zapisujemy i pokazujemy wszystkie paragony
        showReceipt();
    });

    document.getElementById('restartTest').addEventListener('click', function() {
        initTest();
    });
    
    // Automatycznie zapisujemy paragon
    showReceipt();
}

// Globalna funkcja do przełączania sekcji
function showSection(sectionId) {
    console.log('Globalna funkcja showSection:', sectionId);
    
    const sections = document.querySelectorAll('.section');
    const navItems = document.querySelectorAll('nav li');
    
    // Ukrywamy wszystkie sekcje
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Aktualizujemy aktywny punkt menu
    navItems.forEach(item => item.classList.remove('active'));
    
    // Znajdujemy i aktywujemy odpowiedni punkt menu
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach((link, index) => {
        if (link.getAttribute('data-section') === sectionId) {
            link.parentElement.classList.add('active');
        }
    });
    
    // Pokazujemy potrzebną sekcję
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Jeśli to sekcja paragon - pokazujemy wszystkie paragony
    if (sectionId === 'paragon') {
        console.log('Wywołanie showAllReceipts dla sekcji paragon');
        showAllReceipts();
    }
    
    // Jeśli to sekcja profilu i włączona szczegółowa statystyka - pokazujemy wykres
    if (sectionId === 'profil' && isDetailedStats) {
        setTimeout(showStatisticsChart, 100);
    }
}