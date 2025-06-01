
let gameStartTime;
document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.database();
    const ServerValue = firebase.database.ServerValue;
    // 獲取 DOM 元素
    const introScreen = document.getElementById('intro-screen');
    const startGameIntroButton = document.getElementById('start-game-intro');

    const storyDisplayScreen = document.getElementById('story-display-screen');
    const typedStoryTextElement = document.getElementById('typed-story-text');
    // >>> 修改這裡：確保你正確獲取 skipStoryButton <<<
    const skipStoryButton = document.getElementById('skip-story-button');
    // >>> 修改結束 <<<
    const continueGameStoryButton = document.getElementById('continue-game-story');

    const gameContainer = document.getElementById('game-container');
    const roomScreen = document.getElementById('room-screen');
    const puzzleScreen = document.getElementById('puzzle-screen');
    const successScreen = document.getElementById('success-screen');

    const interactableItems = document.querySelectorAll('.interactable-item');
    const backToRoomButton = document.getElementById('back-to-room');
    const passwordInput = document.getElementById('password');
    const submitButton = document.getElementById('submit-button');
    const passwordFeedback = document.getElementById('password-feedback');

    const puzzleTitle = document.getElementById('puzzle-title');
    const puzzleContent = document.getElementById('puzzle-content');
    const submitPuzzleButton = document.getElementById('submit-puzzle'); // 確保這個按鈕在HTML中存在
    const puzzleFeedback = document.getElementById('puzzle-feedback');

    const restartButton = document.getElementById('restart-button');
    const endButton = document.getElementById('end-button');
    const successAnimation = document.getElementById('success-animation');

    const bodyElement = document.body;

    let currentPuzzle = null;
    const correctPassword = "1438";
    const solvedPuzzles = {};

    // ================== 拼圖相關的 DOM 元素和變數 (此區塊保持不變) ==================
    const puzzleImageSrc = 'image/puzzle_image.jpg';
    const puzzleCols = 3;
    const puzzleRows = 3;
    const puzzleTileSize = 100;
    let puzzleBoard = [];
    let emptyTileIndex;

    const puzzleGameContainer = document.createElement('div');
    puzzleGameContainer.id = 'puzzle-game';
    puzzleGameContainer.style.display = 'grid';
    puzzleGameContainer.style.gridTemplateColumns = `repeat(${puzzleCols}, ${puzzleTileSize}px)`;
    puzzleGameContainer.style.gridTemplateRows = `repeat(${puzzleRows}, ${puzzleTileSize}px)`;
    puzzleGameContainer.style.width = `${puzzleCols * puzzleTileSize}px`;
    puzzleGameContainer.style.height = `${puzzleRows * puzzleTileSize}px`;
    puzzleGameContainer.style.border = '2px solid #333';
    puzzleGameContainer.style.margin = '20px auto';

    const puzzleSolvedDisplay = document.createElement('div');
    puzzleSolvedDisplay.id = 'puzzle-solved-display';
    puzzleSolvedDisplay.style.display = 'none';
    puzzleSolvedDisplay.innerHTML = '<p>密碼是：<span id="puzzle-password-digit"></span></p>';
    const puzzlePasswordDigit = puzzleSolvedDisplay.querySelector('#puzzle-password-digit');
    // =======================================================================

    // ================== 書櫃遊戲相關的 DOM 元素和變數 (此區塊保持不變) ==================
    const bookContainer = document.createElement('div');
    bookContainer.id = 'book-display';
    bookContainer.style.textAlign = 'center';
    bookContainer.style.width = 'fit-content';
    bookContainer.style.margin = '0 auto';

    const bookImage = document.createElement('img');
    bookImage.id = 'book-image';
    bookImage.style.width = '400px';
    bookImage.style.height = '300px';
    bookImage.style.cursor = 'pointer';

    const bookshelfAnswerInput = document.createElement('input');
    bookshelfAnswerInput.type = 'text';
    bookshelfAnswerInput.id = 'bookshelf-answer-input';
    bookshelfAnswerInput.maxLength = 1;
    bookshelfAnswerInput.placeholder = '輸入數字';
    bookshelfAnswerInput.style.marginTop = '20px';
    bookshelfAnswerInput.style.display = 'none';

    const bookImagePaths = [
        'image/book_closed.jpg',
        'image/book_page1.png',
        'image/book_page2.png'
    ];
    let currentBookPageIndex = 0;
    // =======================================================================

    // ================== 音樂盒遊戲相關的 DOM 元素和變數 (此區塊保持不變) ==================
    const musicboxAudio = new Audio('image/musicbox_melody.mp3');

    const playMusicButton = document.createElement('button');
    playMusicButton.id = 'play-music-button';
    playMusicButton.textContent = '播放音樂';
    playMusicButton.style.marginTop = '20px';
    playMusicButton.style.display = 'block';
    playMusicButton.style.margin = '20px auto 10px auto';

    const pauseMusicButton = document.createElement('button');
    pauseMusicButton.id = 'pause-music-button';
    pauseMusicButton.textContent = '暫停音樂';
    pauseMusicButton.style.marginTop = '10px';
    pauseMusicButton.style.display = 'none';
    pauseMusicButton.style.margin = '10px auto 20px auto';

    const musicboxAnswerInput = document.createElement('input');
    musicboxAnswerInput.type = 'number';
    musicboxAnswerInput.id = 'musicbox-answer-input';
    musicboxAnswerInput.placeholder = '輸入數字';
    musicboxAnswerInput.style.marginTop = '20px';
    musicboxAnswerInput.style.display = 'block';
    musicboxAnswerInput.style.margin = '20px auto';

    // =======================================================================

    // 定義故事文字（每一行作為一個元素）
    const storyLines = [
        "你無意間闖入了這個神秘的地方，",
        "這是一個雜亂但溫馨氛圍的小房間。",
        "要順利通過，你必須解開四個小謎題，",
        "找到四位數密碼。",
        "仔細觀察房間裡的每個角落"
    ];
    let currentLineIndex = 0; // 當前正在處理的行索引
    let lineDelay = 1500; // 每行結束後的延遲（毫秒）

    // >>> 新增：用來儲存 typeStory 的 setTimeout ID，以便清除 <<<
    let storyTimeoutId;
    // >>> 新增結束 <<<

    // --- 初始設定 ---
    introScreen.style.display = 'flex';
    storyDisplayScreen.style.display = 'none';
    gameContainer.style.display = 'none';
    roomScreen.style.display = 'none';

    // --- 點擊「開始遊戲」按鈕 (intro-screen) ---
    startGameIntroButton.addEventListener('click', () => {
        gameStartTime = Date.now(); // 遊戲從這裡開始計時
        introScreen.style.opacity = '0';
        introScreen.style.pointerEvents = 'none';
        bodyElement.classList.add('zoom-in');

        setTimeout(() => {
            introScreen.style.display = 'none';
            bodyElement.classList.remove('zoom-in');
            bodyElement.classList.add('room-background');

            setTimeout(() => {
                showStoryScreen();
            }, 1000);

        }, 3000);
    });

    // --- 顯示故事畫面並開始打字函數 ---
    function showStoryScreen() {
        storyDisplayScreen.style.display = 'flex';
        setTimeout(() => {
            storyDisplayScreen.classList.add('active');
        }, 50);

        typedStoryTextElement.innerHTML = ''; // 清空內容
        currentLineIndex = 0; // 重置行索引
        continueGameStoryButton.style.display = 'none'; // 確保繼續按鈕初始是隱藏的

        // >>> 新增：顯示跳過按鈕 <<<
        skipStoryButton.style.display = 'block';
        // >>> 新增結束 <<<

        typeStory(); // 開始顯示動畫
    }

    // --- 打字效果函數 (已還原為你原有的淡入效果，並加入清除機制) ---
    function typeStory() {
        // >>> 修改這裡：清除任何現有的 setTimeout，防止衝突 <<<
        if (storyTimeoutId) {
            clearTimeout(storyTimeoutId);
        }
        // >>> 修改結束 <<<

        if (currentLineIndex < storyLines.length) {
            const currentLine = storyLines[currentLineIndex];
            const lineSpan = document.createElement('span');
            lineSpan.classList.add('story-line');
            lineSpan.textContent = currentLine;
            typedStoryTextElement.appendChild(lineSpan);

            setTimeout(() => {
                lineSpan.classList.add('is-visible');
            }, 50);

            currentLineIndex++;

            if (currentLineIndex < storyLines.length) {
                // >>> 修改這裡：將 setTimeout 的 ID 存起來 <<<
                storyTimeoutId = setTimeout(typeStory, lineDelay);
                // >>> 修改結束 <<<
            } else {
                // 所有故事行播放完畢
                setTimeout(() => {
                    continueGameStoryButton.style.display = 'block';
                    // >>> 新增：故事結束後隱藏跳過按鈕 <<<
                    skipStoryButton.style.display = 'none';
                    // >>> 新增結束 <<<
                }, 500);
            }
        }
    }

    // >>> 新增這個函數：跳過故事的邏輯 <<<
    function skipStory() {
        // 清除任何正在進行的故事播放定時器
        if (storyTimeoutId) {
            clearTimeout(storyTimeoutId);
        }

        typedStoryTextElement.innerHTML = ''; // 清空所有已顯示的故事文字

        // 立即顯示所有故事行
        storyLines.forEach(line => {
            const lineSpan = document.createElement('span');
            lineSpan.classList.add('story-line', 'is-visible'); // 直接添加 'is-visible' 讓它立即顯示
            lineSpan.textContent = line;
            typedStoryTextElement.appendChild(lineSpan);
        });

        // 顯示「繼續遊戲」按鈕
        continueGameStoryButton.style.display = 'block';
        // 隱藏「跳過故事」按鈕
        skipStoryButton.style.display = 'none';
    }
    // >>> 新增結束 <<<

    // --- 點擊「繼續遊戲」按鈕 (story-display-screen) ---
    continueGameStoryButton.addEventListener('click', () => {
        storyDisplayScreen.classList.remove('active');
        storyDisplayScreen.style.pointerEvents = 'none';
        setTimeout(() => {
            storyDisplayScreen.style.display = 'none';
            gameContainer.style.display = 'block';
            roomScreen.style.display = 'block';
        }, 500);
    });

    // >>> 新增這裡：綁定跳過按鈕的點擊事件 <<<
    skipStoryButton.addEventListener('click', skipStory);
    // >>> 新增結束 <<<


    // --- 遊戲內部的互動邏輯 (以下程式碼保持不變) ---

    // 點擊房間內的互動物件
    interactableItems.forEach(item => {
        item.addEventListener('click', () => {
            const itemId = item.id.split('-')[1];
            console.log('點擊的物品 ID:', itemId);
            currentPuzzle = itemId;
            showPuzzle(itemId);
            console.log('準備顯示的謎題:', itemId);
        });
    });

    // 返回房間按鈕
    backToRoomButton.addEventListener('click', () => {
        puzzleScreen.style.display = 'none';
        roomScreen.style.display = 'block';
        backToRoomButton.style.display = 'none';
        puzzleFeedback.textContent = '';

        if (submitPuzzleButton) {
            submitPuzzleButton.style.display = 'none';
            submitPuzzleButton.onclick = null;
        }

        bookContainer.style.display = 'none';
        bookshelfAnswerInput.style.display = 'none';
        bookshelfAnswerInput.value = '';
        currentBookPageIndex = 0;
        bookImage.removeEventListener('click', handleBookClick);

        musicboxAudio.pause();
        musicboxAudio.currentTime = 0;
        playMusicButton.style.display = 'none';
        pauseMusicButton.style.display = 'none';
        musicboxAnswerInput.style.display = 'none';
        musicboxAnswerInput.value = '';
        musicboxAudio.removeEventListener('ended', handleMusicEnded);

        puzzleGameContainer.style.display = 'grid';
        puzzleSolvedDisplay.style.display = 'none';
        resetPuzzle();

        if (solvedPuzzles[currentPuzzle]) {
            updatePasswordDisplay();
        }
    });

    // 提交密碼
    submitButton.addEventListener('click', () => {
        if (passwordInput.value === correctPassword) {
            roomScreen.style.display = 'none';
            successScreen.style.display = 'block';
            successAnimation.textContent = '🎉 恭喜！恭喜！撒花！撒花！ 🌸';
            gameContainer.style.display = 'block';
            successScreen.classList.add('active');
            // === 新增：計算逃脫時間並儲存到 Realtime Database ===
            if (gameStartTime) {
                const escapeTime = Date.now() - gameStartTime;
                const minutes = Math.floor(escapeTime / 60000);
                const seconds = ((escapeTime % 60000) / 1000).toFixed(0);

                const record = {
                    time_ms: escapeTime,
                    time_display: `${minutes}分${seconds}秒`,
                    timestamp: ServerValue.TIMESTAMP,
                };

                db.ref('leaderboard').push(record)
                .then(() => {
                    console.log("逃脫時間記錄成功！");
                    displayLeaderboard(); // 你自己的函數
                })
                .catch((error) => {
                    console.error("寫入資料庫錯誤:", error);
                });
            }
            // ===========================================
        } else {
            passwordFeedback.textContent = '密碼錯誤，再試一次！';
        }
    });

    // 再玩一次按鈕
    restartButton.addEventListener('click', () => {
        for (const key in solvedPuzzles) {
            delete solvedPuzzles[key];
        }
        passwordInput.value = '';
        passwordFeedback.textContent = '';

        // >>> 修改這裡：重置時確保清除故事播放的定時器 <<<
        if (storyTimeoutId) {
            clearTimeout(storyTimeoutId);
        }
        // >>> 修改結束 <<<
        typedStoryTextElement.innerHTML = '';
        currentLineIndex = 0;
        continueGameStoryButton.style.display = 'none';
        // >>> 新增：重置時隱藏跳過按鈕 <<<
        skipStoryButton.style.display = 'none';
        // >>> 新增結束 <<<

        introScreen.style.display = 'flex';
        introScreen.style.opacity = '1';
        introScreen.style.pointerEvents = 'auto';

        successScreen.style.display = 'none';
        gameContainer.style.display = 'none';
        roomScreen.style.display = 'none';
        storyDisplayScreen.style.display = 'none';

        bodyElement.classList.remove('room-background');
        bodyElement.classList.remove('zoom-in');
        bodyElement.style.backgroundImage = 'url("image/house.jpg")';
        bodyElement.style.backgroundSize = '100% 100%';
        bodyElement.style.backgroundPosition = 'center';
        bodyElement.style.backgroundColor = 'transparent';
    });

    // 結束按鈕
    endButton.addEventListener('click', () => {
        alert('感謝遊玩！期待下次再見！');
    });

    // 顯示謎題內容 (以下程式碼保持不變)
    function showPuzzle(puzzleId) {
        puzzleScreen.style.display = 'flex';
        roomScreen.style.display = 'none';
        backToRoomButton.style.display = 'block';
        puzzleContent.innerHTML = '';

        if (submitPuzzleButton) {
            submitPuzzleButton.style.display = 'none';
        }
        puzzleFeedback.textContent = '';

        puzzleGameContainer.style.display = 'none';
        bookContainer.style.display = 'none';
        bookshelfAnswerInput.style.display = 'none';

        musicboxAudio.pause();
        musicboxAudio.currentTime = 0;
        //playMusicButton.style.display = 'block';
        //pauseMusicButton.style.display = 'none';


        switch (puzzleId) {
            case 'calendar':
                puzzleTitle.textContent = '謎題一：日曆';
                puzzleContent.innerHTML = `
                    <p>日曆上圈起來的是？</p>
                    <img src="image/calendar_full.png" alt="放大後的月曆圖片" style="width: 300px; height: 300px; display: block; margin: 0 auto 20px auto;">
                    <input type="number" id="calendar-answer" placeholder="輸入數字">
                `;
                if (submitPuzzleButton) {
                    submitPuzzleButton.onclick = () => checkCalendarAnswer();
                    submitPuzzleButton.style.display = 'block';
                }
                console.log('進入日曆謎題邏輯');
                break;
            case 'bookshelf':
                puzzleTitle.textContent = '謎題二：書架';
                puzzleContent.innerHTML = '<p>點擊書本翻頁，找出線索。</p>';
                puzzleContent.appendChild(bookContainer);
                bookContainer.appendChild(bookImage);
                puzzleContent.appendChild(bookshelfAnswerInput);

                currentBookPageIndex = 0;
                bookImage.src = bookImagePaths[currentBookPageIndex];
                bookContainer.style.display = 'block';

                bookImage.removeEventListener('click', handleBookClick);
                bookImage.addEventListener('click', handleBookClick);

                if (submitPuzzleButton) {
                    submitPuzzleButton.style.display = 'none';
                }
                console.log('進入書櫃謎題邏輯');
                break;
            case 'puzzle':
                puzzleTitle.textContent = '謎題三：拼圖';
                puzzleContent.appendChild(puzzleGameContainer);
                puzzleContent.appendChild(puzzleSolvedDisplay);
                puzzleSolvedDisplay.style.display = 'none';
                puzzlePasswordDigit.textContent = '';
                puzzleGameContainer.style.display = 'grid';
                initPuzzle();
                break;
            case 'musicbox':
                puzzleTitle.textContent = '謎題四：音樂盒';
                puzzleContent.innerHTML = '<p>請問這段歌裡面出現幾種顏色？</p>';

                puzzleContent.appendChild(playMusicButton);
                puzzleContent.appendChild(pauseMusicButton);
                puzzleContent.appendChild(musicboxAnswerInput);

                // 明確設定所有相關元素的顯示狀態
                playMusicButton.style.display = 'block'; // 播放按鈕應該可見
                pauseMusicButton.style.display = 'none';  // 暫停按鈕應該隱藏
                musicboxAnswerInput.style.display = 'block'; // <-- 確保輸入框在這裡被顯示
                musicboxAnswerInput.value = ''; // 清空輸入框的內容

                playMusicButton.removeEventListener('click', playMusic);
                playMusicButton.addEventListener('click', playMusic);
                pauseMusicButton.removeEventListener('click', pauseMusic);
                pauseMusicButton.addEventListener('click', pauseMusic);

                if (submitPuzzleButton) {
                    submitPuzzleButton.onclick = () => checkMusicboxAnswer();
                    submitPuzzleButton.style.display = 'block';
                }
                break;
            default:
                puzzleTitle.textContent = '錯誤的謎題';
                puzzleContent.textContent = '找不到這個謎題。';
                if (submitPuzzleButton) {
                    submitPuzzleButton.style.display = 'none';
                }
        }
    }

    // ================== 拼圖遊戲邏輯 (以下程式碼保持不變) ==================
    function initPuzzle() {
        puzzleGameContainer.innerHTML = '';
        puzzleBoard = [];
        for (let i = 0; i < puzzleCols * puzzleRows; i++) {
            const tile = document.createElement('div');
            tile.classList.add('puzzle-tile');
            tile.dataset.index = i;
            tile.style.backgroundImage = `url(${puzzleImageSrc})`;
            const x = (i % puzzleCols) * puzzleTileSize;
            const y = Math.floor(i / puzzleCols) * puzzleTileSize;
            tile.style.backgroundPosition = `-${x}px -${y}px`;
            if (i === puzzleCols * puzzleRows - 1) {
                tile.classList.add('empty');
                tile.style.backgroundImage = 'none';
                emptyTileIndex = i;
            }
            puzzleBoard.push(tile);
        }
        shufflePuzzle();
        renderPuzzle();
        puzzleGameContainer.removeEventListener('click', handleTileClick);
        puzzleGameContainer.addEventListener('click', handleTileClick);
    }

    function shufflePuzzle() {
        for (let i = puzzleBoard.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [puzzleBoard[i], puzzleBoard[j]] = [puzzleBoard[j], puzzleBoard[i]];
        }
        emptyTileIndex = puzzleBoard.findIndex(tile => tile.classList.contains('empty'));
        if (emptyTileIndex !== puzzleCols * puzzleRows - 1) {
            const lastTileIndex = puzzleCols * puzzleRows - 1;
            [puzzleBoard[emptyTileIndex], puzzleBoard[lastTileIndex]] = [puzzleBoard[lastTileIndex], puzzleBoard[emptyTileIndex]];
            emptyTileIndex = lastTileIndex;
        }
    }

    function renderPuzzle() {
        puzzleGameContainer.innerHTML = '';
        puzzleBoard.forEach(tile => {
            puzzleGameContainer.appendChild(tile);
        });
    }

    function handleTileClick(event) {
        const clickedTile = event.target;
        if (!clickedTile.classList.contains('puzzle-tile') || clickedTile.classList.contains('empty')) {
            return;
        }
        const clickedIndex = Array.from(puzzleGameContainer.children).indexOf(clickedTile);
        if (clickedIndex === -1) return;
        const rowClicked = Math.floor(clickedIndex / puzzleCols);
        const colClicked = clickedIndex % puzzleCols;
        const rowEmpty = Math.floor(emptyTileIndex / puzzleCols);
        const colEmpty = emptyTileIndex % puzzleCols;
        const isAdjacent =
            (Math.abs(rowClicked - rowEmpty) === 1 && colClicked === colEmpty) ||
            (Math.abs(colClicked - colEmpty) === 1 && rowClicked === rowEmpty);
        if (isAdjacent) {
            [puzzleBoard[clickedIndex], puzzleBoard[emptyTileIndex]] = [puzzleBoard[emptyTileIndex], puzzleBoard[clickedIndex]];
            renderPuzzle();
            emptyTileIndex = clickedIndex;
            if (checkPuzzleSolved()) {
                puzzleFeedback.textContent = '恭喜你，拼圖完成了！';
                handlePuzzleSolved();
            }
        }
    }

    function checkPuzzleSolved() {
        for (let i = 0; i < puzzleBoard.length; i++) {
            if (puzzleBoard[i].classList.contains('empty')) continue;
            if (parseInt(puzzleBoard[i].dataset.index) !== i) {
                return false;
            }
        }
        return true;
    }

    function handlePuzzleSolved() {
        puzzleGameContainer.removeEventListener('click', handleTileClick);
        const tiles = puzzleGameContainer.querySelectorAll('.puzzle-tile');
        tiles.forEach((tile, index) => {
            setTimeout(() => {
                tile.classList.add('fade-out');
            }, index * 100);
        });
        setTimeout(() => {
            puzzleGameContainer.style.display = 'none';
            puzzleSolvedDisplay.style.display = 'block';
            puzzlePasswordDigit.textContent = '3';
            solvedPuzzles['puzzle'] = '3';
            updatePasswordDisplay();
            backToRoomButton.style.display = 'block';
        }, tiles.length * 100 + 1000);
    }

    function resetPuzzle() {
        puzzleGameContainer.innerHTML = '';
        puzzleGameContainer.style.display = 'grid';
        puzzleSolvedDisplay.style.display = 'none';
        puzzlePasswordDigit.textContent = '';
        puzzleFeedback.textContent = '';
        const tiles = puzzleGameContainer.querySelectorAll('.puzzle-tile.fade-out');
        tiles.forEach(tile => tile.classList.remove('fade-out'));
    }
    // ==================================================================

    // ================== 書櫃遊戲邏輯 (以下程式碼保持不變) ==================
    function handleBookClick() {
        currentBookPageIndex++;

        if (currentBookPageIndex >= bookImagePaths.length) {
            currentBookPageIndex = 0;
        }

        bookImage.src = bookImagePaths[currentBookPageIndex];

        if (submitPuzzleButton) {
            if (currentBookPageIndex === 2) {
                submitPuzzleButton.style.display = 'block';
                submitPuzzleButton.onclick = () => checkBookshelfAnswer();
                bookshelfAnswerInput.style.display = 'block';
                bookshelfAnswerInput.focus();

            } else {
                submitPuzzleButton.style.display = 'none';
                bookshelfAnswerInput.style.display = 'none';
            }
        }

        if (currentBookPageIndex === 0) {
            puzzleFeedback.textContent = '點擊書本翻頁，找出線索。';
        } else if (currentBookPageIndex === 1) {
            puzzleFeedback.textContent = '第一頁內容。';
        } else if (currentBookPageIndex === 2) {
            puzzleFeedback.textContent = '這是最後一頁線索，請輸入答案！';
        } else {
            puzzleFeedback.textContent = '';
        }
    }

    function checkBookshelfAnswer() {
        if (!bookshelfAnswerInput) {
            puzzleFeedback.textContent = '請先翻到線索頁並輸入答案！';
            return;
        }
        const answer = bookshelfAnswerInput.value.toUpperCase();
        if (answer === '4') {
            solvedPuzzles['bookshelf'] = '4';
            puzzleFeedback.textContent = '答對了！';
            updatePasswordDisplay();
            setTimeout(() => backToRoomButton.click(), 1000);
        } else {
            puzzleFeedback.textContent = '再仔細看看書名喔！';
        }
    }
    // ==================================================================

    // ================== 音樂盒遊戲邏輯 (以下程式碼保持不變) ==================

    function playMusic() {
        musicboxAudio.play();
        playMusicButton.style.display = 'none';
        pauseMusicButton.style.display = 'block';

        musicboxAudio.removeEventListener('ended', handleMusicEnded);
        musicboxAudio.addEventListener('ended', handleMusicEnded);
    }

    function pauseMusic() {
        musicboxAudio.pause();
        playMusicButton.style.display = 'block';
        pauseMusicButton.style.display = 'none';
        musicboxAudio.removeEventListener('ended', handleMusicEnded);
    }

    function handleMusicEnded() {
        playMusicButton.style.display = 'block';
        pauseMusicButton.style.display = 'none';
        puzzleFeedback.textContent = '音樂播放完畢，可以再聽一次或輸入答案。';
        musicboxAudio.removeEventListener('ended', handleMusicEnded);
    }


    function checkCalendarAnswer() {
        const answer = document.getElementById('calendar-answer').value;
        if (answer === '1') {
            solvedPuzzles['calendar'] = answer;
            puzzleFeedback.textContent = '答對了！';
            updatePasswordDisplay();
            setTimeout(() => backToRoomButton.click(), 1000);
        } else {
            puzzleFeedback.textContent = '再想想看喔！';
        }
    }

    function checkMusicboxAnswer() {
        const answer = musicboxAnswerInput.value;
        if (answer === '8') {
            solvedPuzzles['musicbox'] = answer;
            puzzleFeedback.textContent = '答對了！';
            updatePasswordDisplay();
            musicboxAudio.pause();
            musicboxAudio.removeEventListener('ended', handleMusicEnded);
            setTimeout(() => backToRoomButton.click(), 1000);
        } else {
            puzzleFeedback.textContent = '再仔細聽聽看有幾種「顏色」喔！';
        }
    }

    function updatePasswordDisplay() {
        let passwordString = '';
        if (solvedPuzzles['calendar']) passwordString += solvedPuzzles['calendar'];
        if (solvedPuzzles['bookshelf']) passwordString += solvedPuzzles['bookshelf'];
        if (solvedPuzzles['puzzle']) passwordString += solvedPuzzles['puzzle'];
        if (solvedPuzzles['musicbox']) passwordString += solvedPuzzles['musicbox'];

        passwordInput.value = passwordString;
    }

    const leaderboardList = document.getElementById('leaderboard-list');

    function displayLeaderboard() {
        leaderboardList.innerHTML = '載入中...'; // 清空並顯示載入訊息

        // 從 Realtime Database 讀取資料
        db.ref('leaderboard')
        .orderByChild('time_ms') // 依照 'time_ms' 子節點的值排序
        .limitToFirst(10) // 限制顯示前 10 名 (因為是升序，所以用 ToFirst)
        .once('value', (snapshot) => { // 'value' 事件讀取所有資料，只讀取一次
            leaderboardList.innerHTML = ''; // 清空載入訊息

            if (!snapshot.exists()) { // 檢查是否有資料
                leaderboardList.innerHTML = '<li>目前沒有排行榜資料。</li>';
                return;
            }

            // Realtime Database 讀取回來的資料是個物件，需要遍歷它
            const leaderboardData = [];
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val(); // 取得每個子節點的資料
                leaderboardData.push(data);
            });

            // 由於 orderByChild 已經排序，直接遍歷即可
            leaderboardData.forEach((data) => {
                const listItem = document.createElement('li');
                // 如果有 playerName，可以顯示 playerName，否則顯示"匿名玩家"
                // const playerName = data.playerName ? data.playerName : "匿名玩家";
                // listItem.textContent = `${playerName} - ${data.time_display}`;
                listItem.textContent = `逃脫時間: ${data.time_display}`;
                leaderboardList.appendChild(listItem);
            });
        })
        .catch((error) => {
            console.error("讀取排行榜錯誤:", error);
            leaderboardList.innerHTML = '<li>載入排行榜失敗。</li>';
        });
    }
});