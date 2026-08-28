/* ===================================================
   📱 FULL FB STORY CREATOR & VIEWER MODULE (ALL IN ONE)
   =================================================== */

// 1. სრული CSS სტილების ინექცია
(function injectStoryStyles() {
  const css = `
    /* VIEWER */
    .story-viewer-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0, 0, 0, 0.95); backdrop-filter: blur(25px);
      z-index: 999999; display: flex; align-items: center; justify-content: center;
    }
    .fb-story-frame {
      position: relative; width: 100%; max-width: 440px; height: 100%;
      max-height: 92vh; background: #000; border-radius: 16px;
      overflow: hidden; display: flex; flex-direction: column;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.9);
    }
    @media (max-width: 600px) { .fb-story-frame { max-height: 100vh; border-radius: 0; } }
    
    /* MULTI-STORY PROGRESS BARS */
    .fb-story-progress-container {
      position: absolute; top: 10px; left: 12px; right: 12px; height: 2.5px;
      display: flex; gap: 4px; z-index: 20;
    }
    .fb-story-segment {
      flex: 1; height: 100%; background: rgba(255, 255, 255, 0.3);
      border-radius: 4px; overflow: hidden; position: relative;
    }
    .fb-story-segment-fill {
      height: 100%; width: 0%; background: #fff;
    }

    .fb-story-header {
      position: absolute; top: 20px; left: 12px; right: 12px; display: flex;
      align-items: center; justify-content: space-between; z-index: 20; text-shadow: 0 2px 4px rgba(0,0,0,0.8);
    }
    .fb-story-user-left { display: flex; align-items: center; gap: 10px; }
    .fb-story-avatar-holder { width: 40px; height: 40px; border-radius: 50%; border: 2px solid #1877f2; overflow: hidden; background: #2a2a2a; }
    .fb-story-avatar-holder img { width: 100%; height: 100%; object-fit: cover; }
    .fb-story-info-meta { display: flex; flex-direction: column; gap: 2px; }
    .fb-story-user-row { display: flex; align-items: center; gap: 8px; }
    .fb-story-username { color: #fff; font-size: 14.5px; font-weight: 700; }
    .fb-story-timestamp { color: rgba(255, 255, 255, 0.75); font-size: 12px; }
    .fb-story-music-pill {
      background: rgba(0, 0, 0, 0.45); backdrop-filter: blur(8px); padding: 2px 8px;
      border-radius: 12px; color: #fff; font-size: 11px; font-weight: 500;
      display: inline-flex; align-items: center; gap: 4px; width: fit-content;
    }
    .fb-story-actions-right { display: flex; align-items: center; gap: 8px; }
    .fb-story-head-btn {
      background: rgba(0, 0, 0, 0.3); backdrop-filter: blur(6px); border: none;
      color: #fff; font-size: 16px; font-weight: bold; width: 32px; height: 32px;
      border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    .fb-story-media-view { width: 100%; height: 100%; background: #000; display: flex; align-items: center; justify-content: center; position: relative; }
    .fb-story-media-view img, .fb-story-media-view video { width: 100%; height: 100%; object-fit: cover !important; }
    
    /* TAP NAVIGATION ZONES */
    .story-tap-zone-left { position: absolute; top: 60px; bottom: 80px; left: 0; width: 35%; z-index: 15; }
    .story-tap-zone-right { position: absolute; top: 60px; bottom: 80px; right: 0; width: 65%; z-index: 15; }

    .story-floating-reactions { position: absolute; bottom: 80px; right: 20px; pointer-events: none; z-index: 25; }
    .flying-story-emoji { position: absolute; bottom: 0; right: 0; font-size: 32px; animation: flyUpAndFade 1.4s ease-out forwards; }
    @keyframes flyUpAndFade {
      0% { transform: translateY(0) scale(0.6); opacity: 1; }
      50% { transform: translateY(-120px) scale(1.3) rotate(-15deg); opacity: 0.9; }
      100% { transform: translateY(-240px) scale(1) rotate(15deg); opacity: 0; }
    }
    .fb-story-footer {
      position: absolute; bottom: 0; left: 0; right: 0;
      padding: 12px 14px max(14px, env(safe-area-inset-bottom));
      display: flex; align-items: center; gap: 10px;
      background: linear-gradient(to top, rgba(0,0,0,0.85), transparent); z-index: 20;
    }
    .fb-story-circle-btn {
      width: 44px; height: 44px; border-radius: 50%; background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.15);
      display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
    }
    .fb-story-circle-btn:active { transform: scale(0.92); }
    .fb-story-input-box {
      flex: 1; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 25px; padding: 0 16px;
      height: 44px; display: flex; align-items: center;
    }
    .fb-story-input-box input { 
      width: 100%; 
      background: transparent; 
      border: none; 
      color: #fff; 
      font-size: 14px; 
      outline: none; 
      font-family: inherit;
      -webkit-user-select: text !important;
      user-select: text !important;
      touch-action: auto !important;
      pointer-events: auto !important;
    }
    .fb-story-input-box input::placeholder { color: rgba(255, 255, 255, 0.7); }
    .fb-story-reactions-group { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .fb-story-react-circle {
      width: 42px; height: 42px; border-radius: 50%; border: none;
      display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4); transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .fb-story-react-circle:active { transform: scale(1.3); }
    .heart-react { background: #ff2d55; }
    .thumb-react { background: #1877f2; }
    .laugh-react { background: #f7b125; }

    /* CREATOR STYLES */
    .fb-story-creator-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: #000; z-index: 1000000; display: flex; align-items: center; justify-content: center;
    }
    .fb-creator-frame {
      position: relative; width: 100%; max-width: 440px; height: 100%;
      max-height: 100vh; background: #0a0a0a; display: flex; flex-direction: column;
      justify-content: space-between; overflow: hidden;
    }
    .fb-creator-top-bar {
      position: absolute; top: 18px; left: 14px; right: 14px;
      display: flex; align-items: center; justify-content: space-between; z-index: 30;
    }
    .fb-creator-icon-btn {
      background: rgba(0, 0, 0, 0.45); border: none; color: #fff;
      width: 42px; height: 42px; border-radius: 50%; cursor: pointer;
      display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);
    }
    .fb-creator-music-pill {
      display: flex; align-items: center; gap: 8px; background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(14px); padding: 6px 14px; border-radius: 25px;
      cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.15); max-width: 65%;
    }
    .fb-music-icon {
      width: 28px; height: 28px; background: #262626; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; font-size: 14px;
    }
    .fb-music-texts { display: flex; flex-direction: column; overflow: hidden; text-align: left; }
    .fb-music-title { color: #fff; font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .fb-music-sub { color: rgba(255, 255, 255, 0.65); font-size: 10.5px; }

    .fb-creator-media-zone {
      position: relative; width: 100%; height: 100%; background: #000;
      display: flex; align-items: center; justify-content: center; overflow: hidden;
    }
    .fb-creator-preview-box { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
    .fb-creator-preview-box img, .fb-creator-preview-box video { width: 100%; height: 100%; object-fit: cover !important; transition: filter 0.3s ease; }
    .fb-creator-overlay-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 20; pointer-events: auto; }
    
    .creator-movable-element {
      position: absolute; cursor: move; user-select: none;
      padding: 6px 12px; border-radius: 8px;
    }
    .creator-text-element {
      color: #fff; font-size: 24px; font-weight: 800; text-shadow: 0 2px 10px rgba(0,0,0,0.9);
      background: rgba(0,0,0,0.25); border-radius: 8px; backdrop-filter: blur(4px);
    }
    .creator-sticker-element { font-size: 54px; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5)); }

    /* TOOLS */
    .fb-creator-tools-bar {
      position: absolute; bottom: 78px; left: 0; right: 0;
      display: flex; align-items: center; justify-content: space-around;
      padding: 0 8px; z-index: 30;
    }
    .fb-creator-tool-item {
      display: flex; flex-direction: column; align-items: center;
      gap: 6px; cursor: pointer; min-width: 60px;
    }
    .fb-creator-tool-item span {
      color: #fff; font-size: 11.5px; font-weight: 500; text-shadow: 0 1px 4px rgba(0,0,0,0.9);
    }
    .fb-tool-icon-circle {
      width: 48px; height: 48px; border-radius: 50%;
      background: rgba(35, 35, 35, 0.65); backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 18px; font-weight: bold; transition: transform 0.12s;
    }
    .fb-creator-tool-item:active .fb-tool-icon-circle { transform: scale(0.9); }

    /* BOTTOM CONTROLS */
    .fb-creator-bottom-bar {
      position: absolute; bottom: 0; left: 0; right: 0;
      padding: 12px 14px max(14px, env(safe-area-inset-bottom));
      background: linear-gradient(to top, rgba(0,0,0,0.95), transparent);
      display: flex; align-items: center; justify-content: space-between; gap: 8px; z-index: 30;
    }
    .fb-creator-privacy-btn {
      display: flex; align-items: center; gap: 6px; background: rgba(255, 255, 255, 0.16);
      backdrop-filter: blur(12px); padding: 10px 14px; border-radius: 22px;
      color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;
    }
    .fb-creator-share-btn {
      background: #1877f2; color: #fff; border: none; padding: 11px 24px;
      border-radius: 22px; font-size: 14px; font-weight: 700; cursor: pointer;
      flex: 1; max-width: 140px; text-align: center;
    }
    .fb-creator-share-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    /* TOOL MODALS */
    .fb-sheet-modal {
      position: absolute; bottom: 0; left: 0; right: 0; max-height: 65vh;
      background: #18191a; border-radius: 20px 20px 0 0; z-index: 50;
      padding: 16px; display: none; flex-direction: column; gap: 12px;
      box-shadow: 0 -5px 25px rgba(0,0,0,0.8);
    }
    .fb-sheet-header {
      display: flex; justify-content: space-between; align-items: center;
      color: #fff; font-size: 16px; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 10px;
    }
    .fb-sheet-close { background: none; border: none; color: #aaa; font-size: 20px; cursor: pointer; }
    .fb-sheet-list { overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
    .fb-music-item {
      display: flex; align-items: center; gap: 12px; padding: 10px;
      background: #242526; border-radius: 10px; cursor: pointer;
    }
    .fb-music-item:hover { background: #3a3b3c; }
    .fb-music-item-info { display: flex; flex-direction: column; color: #fff; font-size: 13.5px; }
    .fb-music-item-info span:last-child { font-size: 11px; color: #b0b3b8; }
    
    .fb-stickers-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 10px 0; }
    .fb-sticker-btn { background: #242526; border: none; border-radius: 12px; font-size: 32px; padding: 10px; cursor: pointer; }
    .fb-sticker-btn:hover { background: #3a3b3c; }

    .fb-filters-grid { display: flex; gap: 10px; overflow-x: auto; padding: 10px 0; }
    .fb-filter-pill {
      background: #242526; color: #fff; border: 1px solid #444;
      padding: 8px 16px; border-radius: 20px; white-space: nowrap; cursor: pointer; font-size: 13px;
    }
  `;
  const styleEl = document.createElement('style');
  styleEl.innerHTML = css;
  document.head.appendChild(styleEl);
})();

// 2. HTML სტრუქტურის ინექცია
(function injectStoryHTML() {
  const container = document.createElement('div');
  container.id = 'story-system-root';
  container.innerHTML = `
    <!-- ფაილის ასარჩევი ფარული ინფუთი -->
    <input type="file" id="story-file-input" accept="image/*,video/*" style="display: none;" onchange="handleStoryFileSelected(event)">

    <!-- 🎨 1. STORY CREATOR MODAL -->
    <div id="story-creator-modal" class="fb-story-creator-overlay" style="display: none;">
      <div class="fb-creator-frame">
        <div class="fb-creator-top-bar">
          <button class="fb-creator-icon-btn" onclick="closeStoryCreator()">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#fff"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          </button>
          <div class="fb-creator-music-pill" onclick="openStoryTool('music')">
            <div class="fb-music-icon">🎵</div>
            <div class="fb-music-texts">
              <span class="fb-music-title" id="creator-music-name">მუსიკის დამატება</span>
              <span class="fb-music-sub">შემოთავაზებები</span>
            </div>
          </div>
          <button class="fb-creator-icon-btn" onclick="resetStoryEdits()" title="გასუფთავება">✕</button>
        </div>

        <div class="fb-creator-media-zone" id="creator-media-zone">
          <div id="creator-media-preview" class="fb-creator-preview-box"></div>
          <div id="creator-overlay-layer" class="fb-creator-overlay-layer"></div>
        </div>

        <div class="fb-creator-tools-bar">
          <div class="fb-creator-tool-item" onclick="openStoryTool('music')">
            <div class="fb-tool-icon-circle">🎵</div>
            <span>მუსიკა</span>
          </div>
          <div class="fb-creator-tool-item" onclick="openStoryTool('stickers')">
            <div class="fb-tool-icon-circle">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
            </div>
            <span>სტიკერები</span>
          </div>
          <div class="fb-creator-tool-item" onclick="openStoryTool('text')">
            <div class="fb-tool-icon-circle">Aa</div>
            <span>ტექსტი</span>
          </div>
          <div class="fb-creator-tool-item" onclick="openStoryTool('effects')">
            <div class="fb-tool-icon-circle">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm1 17.93V18a1 1 0 01-2 0v-.07A8 8 0 014.07 13H6a1 1 0 010-2H4.07A8 8 0 0111 4.07V6a1 1 0 012 0V4.07A8 8 0 0119.93 11H18a1 1 0 010 2h1.93A8 8 0 0113 19.93z"/></svg>
            </div>
            <span>ეფექტები</span>
          </div>
          <div class="fb-creator-tool-item" onclick="openStoryTool('mention')">
            <div class="fb-tool-icon-circle">@</div>
            <span>ახსენეთ</span>
          </div>
        </div>

        <div class="fb-creator-bottom-bar">
          <div class="fb-creator-privacy-btn">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            <span>საჯარო</span>
          </div>
          <div class="fb-creator-privacy-btn">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff"><path d="M12 7c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5 2.24-5 5-5m0-2c-3.87 0-7 3.13-7 7s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 10a3 3 0 110-6 3 3 0 010 6z"/></svg>
            <span>გამორთული</span>
          </div>
          <button class="fb-creator-share-btn" id="story-publish-btn" onclick="publishCreatedStory()">გაზიარება</button>
        </div>

        <!-- 🎵 1. MUSIC SELECTOR SHEET -->
        <div id="sheet-music" class="fb-sheet-modal">
          <div class="fb-sheet-header">
            <span>მუსიკის არჩევა</span>
            <button class="fb-sheet-close" onclick="closeSheet('sheet-music')">✕</button>
          </div>
          <div class="fb-sheet-list">
            <div class="fb-music-item" onclick="selectMusic('Die With A Smile', 'https://raw.githubusercontent.com/jimsher/Emigrantbook/main/music/die-with-a-smile.mp3')">
              <span>🎵</span>
              <div class="fb-music-item-info"><span>Die With A Smile</span><span>Lady Gaga, Bruno Mars</span></div>
            </div>
            <div class="fb-music-item" onclick="selectMusic('BIRDS OF A FEATHER', 'https://raw.githubusercontent.com/jimsher/Emigrantbook/main/music/birds-of-a-feather.mp3')">
              <span>🎵</span>
              <div class="fb-music-item-info"><span>BIRDS OF A FEATHER</span><span>Billie Eilish</span></div>
            </div>
            <div class="fb-music-item" onclick="selectMusic('Espresso', 'https://raw.githubusercontent.com/jimsher/Emigrantbook/main/music/espresso.mp3')">
              <span>🎵</span>
              <div class="fb-music-item-info"><span>Espresso</span><span>Sabrina Carpenter</span></div>
            </div>
            <div class="fb-music-item" onclick="selectMusic('Blinding Lights', 'https://raw.githubusercontent.com/jimsher/Emigrantbook/main/music/blinding-lights.mp3')">
              <span>🎵</span>
              <div class="fb-music-item-info"><span>Blinding Lights</span><span>The Weeknd</span></div>
            </div>
          </div>
        </div>

        <!-- 😃 2. STICKERS SHEET -->
        <div id="sheet-stickers" class="fb-sheet-modal">
          <div class="fb-sheet-header">
            <span>სტიკერები</span>
            <button class="fb-sheet-close" onclick="closeSheet('sheet-stickers')">✕</button>
          </div>
          <div class="fb-stickers-grid">
            <button class="fb-sticker-btn" onclick="addSticker('🔥')">🔥</button>
            <button class="fb-sticker-btn" onclick="addSticker('❤️')">❤️</button>
            <button class="fb-sticker-btn" onclick="addSticker('🎉')">🎉</button>
            <button class="fb-sticker-btn" onclick="addSticker('✨')">✨</button>
            <button class="fb-sticker-btn" onclick="addSticker('👑')">👑</button>
            <button class="fb-sticker-btn" onclick="addSticker('🚀')">🚀</button>
            <button class="fb-sticker-btn" onclick="addSticker('💯')">💯</button>
            <button class="fb-sticker-btn" onclick="addSticker('⭐')">⭐</button>
          </div>
        </div>

        <!-- 🎨 3. EFFECTS / FILTERS SHEET -->
        <div id="sheet-effects" class="fb-sheet-modal">
          <div class="fb-sheet-header">
            <span>ფილტრები & ეფექტები</span>
            <button class="fb-sheet-close" onclick="closeSheet('sheet-effects')">✕</button>
          </div>
          <div class="fb-filters-grid">
            <button class="fb-filter-pill" onclick="applyMediaFilter('none')">ორიგინალი</button>
            <button class="fb-filter-pill" onclick="applyMediaFilter('grayscale(100%)')">B & W</button>
            <button class="fb-filter-pill" onclick="applyMediaFilter('sepia(60%) contrast(110%)')">Vintage</button>
            <button class="fb-filter-pill" onclick="applyMediaFilter('saturate(180%) contrast(110%)')">Vibrant</button>
            <button class="fb-filter-pill" onclick="applyMediaFilter('brightness(120%) contrast(90%)')">Soft Glow</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 📱 2. STORY VIEWER MODAL -->
    <div id="story-viewer-modal" class="story-viewer-overlay" style="display: none;" onclick="closeStoryViewer()">
      <div class="fb-story-frame" onclick="event.stopPropagation()">
        <!-- Multi segments progress bar -->
        <div class="fb-story-progress-container" id="story-progress-container"></div>

        <div class="fb-story-header">
          <div class="fb-story-user-left">
            <div class="fb-story-avatar-holder" id="sv-avatar"></div>
            <div class="fb-story-info-meta">
              <div class="fb-story-user-row">
                <span class="fb-story-username" id="sv-username">User</span>
                <span class="fb-story-timestamp" id="sv-time">Just now</span>
              </div>
              <div class="fb-story-music-pill" id="sv-music-tag">
                <span>🎵</span> <span id="sv-music-title">Original Audio</span>
              </div>
            </div>
          </div>
          <div class="fb-story-actions-right">
            <button class="fb-story-head-btn" onclick="closeStoryViewer()" title="Close">✕</button>
            <button class="fb-story-head-btn" onclick="alert('Options')" title="More">•••</button>
          </div>
        </div>

        <div class="fb-story-media-view" id="sv-media-container" onmousedown="pauseStoryTimer()" onmouseup="resumeStoryTimer()" ontouchstart="pauseStoryTimer()" ontouchend="resumeStoryTimer()">
          <div class="story-tap-zone-left" onclick="goToPrevStoryItem(event)"></div>
          <div class="story-tap-zone-right" onclick="goToNextStoryItem(event)"></div>
        </div>
        
        <div id="story-floating-reactions-zone" class="story-floating-reactions"></div>

        <div class="fb-story-footer">
          <!-- ➕ დამატების პლიუსის ღილაკი -->
          <button class="fb-story-circle-btn" onclick="addNewStoryFromViewer()" title="ახალი სთორის დამატება">
            <svg viewBox="0 0 24 24" style="width:22px;height:22px;fill:#fff;"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          </button>
          <div class="fb-story-input-box">
            <input type="text" id="story-comment-field" placeholder="შეტყობინების გაგზავნა..." 
                   autocomplete="off" autocorrect="off" autocapitalize="sentences"
                   onfocus="pauseStoryTimer()" onblur="resumeStoryTimer()"
                   onkeydown="handleStoryCommentKeyPress(event)">
          </div>
          <div class="fb-story-reactions-group">
            <button class="fb-story-react-circle heart-react" onclick="reactToStoryFacebook('❤️')"><span>❤️</span></button>
            <button class="fb-story-react-circle thumb-react" onclick="reactToStoryFacebook('👍')"><span>👍</span></button>
            <button class="fb-story-react-circle laugh-react" onclick="reactToStoryFacebook('😆')"><span>😆</span></button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(container));
  if (document.body) document.body.appendChild(container);
})();

// 3. MULTI-STORY VIEWER LOGIC
var activeUserStoryGroup = [];
var activeStoryIndex = 0;
var storyProgressInterval = null;
var storyProgressPct = 0;
var isStoryPaused = false;
var storyAudioPlayer = new Audio();

function openStoryGroupViewer(userStories, startIndex, username, avatarUrl) {
  if (!userStories || userStories.length === 0) return;
  activeUserStoryGroup = userStories;
  activeStoryIndex = startIndex || 0;

  var modal = document.getElementById('story-viewer-modal');
  if (modal) modal.style.display = "flex";

  renderProgressBarsUI();
  displayActiveStoryItem(username, avatarUrl);
}

// პროგრეს-ბარების დაყოფა სთორების რაოდენობის მიხედვით
function renderProgressBarsUI() {
  var container = document.getElementById('story-progress-container');
  if (!container) return;
  var html = "";
  for (var i = 0; i < activeUserStoryGroup.length; i++) {
    html += `
      <div class="fb-story-segment">
        <div class="fb-story-segment-fill" id="story-seg-fill-${i}"></div>
      </div>
    `;
  }
  container.innerHTML = html;
}

// კონკრეტული სთორის ჩვენება
function displayActiveStoryItem(username, avatarUrl) {
  var story = activeUserStoryGroup[activeStoryIndex];
  if (!story) {
    closeStoryViewer();
    return;
  }

  for (var i = 0; i < activeUserStoryGroup.length; i++) {
    var seg = document.getElementById('story-seg-fill-' + i);
    if (seg) {
      if (i < activeStoryIndex) seg.style.width = '100%';
      else seg.style.width = '0%';
    }
  }

  var userSpan = document.getElementById('sv-username');
  var timeSpan = document.getElementById('sv-time');
  var avatarDiv = document.getElementById('sv-avatar');
  var mediaContainer = document.getElementById('sv-media-container');
  var musicTag = document.getElementById('sv-music-tag');
  var musicTitle = document.getElementById('sv-music-title');

  if (userSpan) userSpan.innerText = username || "User";

  if (musicTitle && musicTag) {
    if (story.music_title && story.music_title !== "Original Audio") {
      musicTag.style.display = "inline-flex";
      musicTitle.innerText = story.music_title;
    } else {
      musicTag.style.display = "none";
    }
  }

  if (timeSpan && story.created_at) {
    var createdDate = story.created_at.toDate ? story.created_at.toDate() : new Date(story.created_at);
    var diffHours = Math.floor((new Date() - createdDate) / (1000 * 60 * 60));
    timeSpan.innerText = diffHours > 0 ? (diffHours + " სთ") : "ახლახანს";
  }

  if (avatarDiv) {
    if (avatarUrl) {
      avatarDiv.innerHTML = `<img src="${avatarUrl}" alt="Avatar">`;
    } else {
      avatarDiv.innerHTML = `<div style="background:#dcae36;color:#111;font-weight:bold;width:100%;height:100%;display:flex;align-items:center;justify-content:center;">${(username || "U").charAt(0).toUpperCase()}</div>`;
    }
  }

  if (mediaContainer) {
    var tapZones = `
      <div class="story-tap-zone-left" onclick="goToPrevStoryItem(event)"></div>
      <div class="story-tap-zone-right" onclick="goToNextStoryItem(event)"></div>
    `;
    if (story.media_type === 'video') {
      mediaContainer.innerHTML = tapZones + `<video id="active-story-video" src="${story.media_url}" autoplay playsinline webkit-playsinline style="width:100%; height:100%; object-fit:cover !important; filter: ${story.filter || 'none'};"></video>`;
      var activeVid = document.getElementById('active-story-video');
      if (activeVid) activeVid.muted = false;
    } else {
      mediaContainer.innerHTML = tapZones + `<img src="${story.media_url}" alt="Story Image" style="width:100%; height:100%; object-fit:cover !important; filter: ${story.filter || 'none'};">`;
    }
  }

  // 🎵 მუსიკის გაშვება
  if (story.music_url && story.media_type !== 'video') {
    storyAudioPlayer.src = story.music_url;
    storyAudioPlayer.currentTime = 0;
    storyAudioPlayer.play().catch(function(){});
  } else {
    storyAudioPlayer.pause();
    storyAudioPlayer.src = "";
  }

  startStoryProgressBar(story.media_type === 'video' ? 12000 : 6000, username, avatarUrl);
}

function startStoryProgressBar(durationMs, username, avatarUrl) {
  clearInterval(storyProgressInterval);
  storyProgressPct = 0;
  var fill = document.getElementById('story-seg-fill-' + activeStoryIndex);
  var stepMs = 50;
  var stepPct = (stepMs / durationMs) * 100;

  storyProgressInterval = setInterval(function() {
    if (!isStoryPaused) {
      storyProgressPct += stepPct;
      if (fill) fill.style.width = Math.min(storyProgressPct, 100) + '%';
      if (storyProgressPct >= 100) {
        clearInterval(storyProgressInterval);
        if (activeStoryIndex < activeUserStoryGroup.length - 1) {
          activeStoryIndex++;
          displayActiveStoryItem(username, avatarUrl);
        } else {
          closeStoryViewer();
        }
      }
    }
  }, stepMs);
}

function goToNextStoryItem(event) {
  if (event) event.stopPropagation();
  var uName = document.getElementById('sv-username').innerText;
  var avImg = document.querySelector('#sv-avatar img');
  var avUrl = avImg ? avImg.src : null;

  if (activeStoryIndex < activeUserStoryGroup.length - 1) {
    activeStoryIndex++;
    displayActiveStoryItem(uName, avUrl);
  } else {
    closeStoryViewer();
  }
}

function goToPrevStoryItem(event) {
  if (event) event.stopPropagation();
  var uName = document.getElementById('sv-username').innerText;
  var avImg = document.querySelector('#sv-avatar img');
  var avUrl = avImg ? avImg.src : null;

  if (activeStoryIndex > 0) {
    activeStoryIndex--;
    displayActiveStoryItem(uName, avUrl);
  }
}

// ➕ სთორის ყურებისას პლიუსზე დაჭერა -> Viewer იხურება და იხსნება ფაილის არჩევა
function addNewStoryFromViewer() {
  closeStoryViewer();
  triggerStoryUpload();
}

function pauseStoryTimer() {
  isStoryPaused = true;
  var vid = document.getElementById('active-story-video');
  if (vid) vid.pause();
  storyAudioPlayer.pause();
}

function resumeStoryTimer() {
  isStoryPaused = false;
  var vid = document.getElementById('active-story-video');
  if (vid) vid.play().catch(function(){});
  var story = activeUserStoryGroup[activeStoryIndex];
  if (story && story.music_url && story.media_type !== 'video') {
    storyAudioPlayer.play().catch(function(){});
  }
}

function closeStoryViewer() {
  clearInterval(storyProgressInterval);
  storyAudioPlayer.pause();
  storyAudioPlayer.src = "";
  var modal = document.getElementById('story-viewer-modal');
  var mediaContainer = document.getElementById('sv-media-container');
  if (mediaContainer) {
    var v = mediaContainer.querySelector('video');
    if (v) {
      v.pause();
      v.src = "";
    }
    mediaContainer.innerHTML = "";
  }
  if (modal) modal.style.display = "none";
  activeUserStoryGroup = [];
  activeStoryIndex = 0;
  isStoryPaused = false;
}

// 💬 დამხმარე უნივერსალური ფუნქცია მესინჯერში ჩასაწერად
 // 💬 დამხმარე ფუნქცია: მესინჯერში ჩაწერა ზუსტად messenger.html-ის სტრუქტურით
function sendStoryInteractionToMessenger(storyAuthorId, textContent) {
  var myUid = (typeof currentUser !== 'undefined' && currentUser) ? currentUser.uid : (firebase.auth().currentUser ? firebase.auth().currentUser.uid : null);
  
  if (!myUid) {
    alert("გთხოვთ გაიაროთ ავტორიზაცია");
    return;
  }
  if (!storyAuthorId) {
    console.error("სთორის ავტორი ვერ მოიძებნა");
    return;
  }

  // chatId ზუსტად ისე, როგორც messenger.html-ში (getChatId)
  var chatId = myUid < storyAuthorId ? (myUid + '_' + storyAuthorId) : (storyAuthorId + '_' + myUid);
  var serverTimestamp = firebase.firestore.FieldValue.serverTimestamp();

  // მესინჯერის messages ქვეკოლექციაში ჩაწერა ზუსტი ველებით
  db.collection('chats').doc(chatId).collection('messages').add({
    senderId: myUid,
    text: textContent,
    read: false,
    createdAt: serverTimestamp, // ზუსტად ის სახელი, რასაც messenger.html-ის orderBy('createdAt') ითხოვს
    created_at: serverTimestamp
  }).then(function() {
    console.log("მესინჯერში წარმატებით ჩაიწერა:", textContent);
  }).catch(function(err) {
    console.error("მესინჯერის შეცდომა:", err);
  });
}

// 1. სთორის რეაქცია (დაგულება / სმაილი)
function reactToStoryFacebook(emoji) {
  var story = activeUserStoryGroup[activeStoryIndex];
  if (!story) return;

  var zone = document.getElementById('story-floating-reactions-zone');
  if (zone) {
    var el = document.createElement('div');
    el.className = 'flying-story-emoji';
    el.innerText = emoji;
    zone.appendChild(el);
    setTimeout(function() { el.remove(); }, 1400);
  }

  var newLikes = (story.likes_count || 0) + 1;
  db.collection('stories').doc(story.id).update({ likes_count: newLikes }).catch(function(){});

  // სთორის ავტორის ამოღება user_id ველიდან
  var authorId = story.user_id;
  if (authorId) {
    sendStoryInteractionToMessenger(authorId, `რეაქცია თქვენს სიუჟეტზე: ${emoji}`);
  }
}

// 2. სთორის ქვედა ველიდან ტექსტური პასუხის გაგზავნა
function handleStoryCommentKeyPress(event) {
  if (event.key === 'Enter') {
    var input = document.getElementById('story-comment-field');
    var story = activeUserStoryGroup[activeStoryIndex];
    if (!input || !story) return;

    var text = input.value.trim();
    if (!text) return;

    var authorId = story.user_id;
    if (authorId) {
      sendStoryInteractionToMessenger(authorId, `პასუხი სიუჟეტზე: "${text}"`);
    }

    input.value = "";
    input.blur();
    resumeStoryTimer();
    alert("შეტყობინება გაიგზავნა მესინჯერში!");
  }
}
 

// 4. CREATOR LOGIC & MERGE
var selectedStoryFile = null;
var selectedStoryMediaType = null;
var storyAttachedMusic = "Original Audio";
var selectedStoryMusicUrl = null;
var currentAppliedFilter = "none";

function triggerStoryUpload() {
  var fileInput = document.getElementById('story-file-input');
  if (fileInput) fileInput.click();
}

function handleStoryFileSelected(event) {
  var file = event.target.files[0];
  if (!file) return;

  selectedStoryFile = file;
  selectedStoryMediaType = file.type.startsWith('video') ? 'video' : 'image';
  currentAppliedFilter = "none";
  storyAttachedMusic = "Original Audio";
  selectedStoryMusicUrl = null;

  var titleEl = document.getElementById('creator-music-name');
  if (titleEl) titleEl.innerText = "მუსიკის დამატება";

  var previewZone = document.getElementById('creator-media-preview');
  var overlayLayer = document.getElementById('creator-overlay-layer');
  if (overlayLayer) overlayLayer.innerHTML = '';

  var fileUrl = URL.createObjectURL(file);

  if (previewZone) {
    if (selectedStoryMediaType === 'video') {
      previewZone.innerHTML = `<video id="creator-target-media" src="${fileUrl}" autoplay loop muted playsinline style="width:100%; height:100%; object-fit:cover !important;"></video>`;
    } else {
      previewZone.innerHTML = `<img id="creator-target-media" src="${fileUrl}" style="width:100%; height:100%; object-fit:cover !important;">`;
    }
  }

  var creatorModal = document.getElementById('story-creator-modal');
  if (creatorModal) creatorModal.style.display = 'flex';

  event.target.value = '';
}

function closeStoryCreator() {
  var creatorModal = document.getElementById('story-creator-modal');
  var previewZone = document.getElementById('creator-media-preview');
  if (previewZone) previewZone.innerHTML = '';
  if (creatorModal) creatorModal.style.display = 'none';
  selectedStoryFile = null;
  selectedStoryMediaType = null;
  closeAllSheets();
}

function resetStoryEdits() {
  var overlayLayer = document.getElementById('creator-overlay-layer');
  if (overlayLayer) overlayLayer.innerHTML = '';
  applyMediaFilter('none');
  storyAttachedMusic = "Original Audio";
  selectedStoryMusicUrl = null;
  var titleEl = document.getElementById('creator-music-name');
  if (titleEl) titleEl.innerText = "მუსიკის დამატება";
}

function openStoryTool(toolType) {
  closeAllSheets();
  if (toolType === 'text') {
    var userText = prompt('შეიყვანეთ ტექსტი:');
    if (userText) makeDraggableText(userText);
  } else if (toolType === 'music') {
    var sheet = document.getElementById('sheet-music');
    if (sheet) sheet.style.display = 'flex';
  } else if (toolType === 'stickers') {
    var sheet = document.getElementById('sheet-stickers');
    if (sheet) sheet.style.display = 'flex';
  } else if (toolType === 'effects') {
    var sheet = document.getElementById('sheet-effects');
    if (sheet) sheet.style.display = 'flex';
  } else if (toolType === 'mention') {
    var userTag = prompt('მონიშნეთ მომხმარებელი: @');
    if (userTag) makeDraggableText('@' + userTag.replace('@', ''));
  }
}

function closeSheet(id) {
  var sheet = document.getElementById(id);
  if (sheet) sheet.style.display = 'none';
}

function closeAllSheets() {
  document.querySelectorAll('.fb-sheet-modal').forEach(el => el.style.display = 'none');
}

function selectMusic(title, musicUrl) {
  storyAttachedMusic = title;
  selectedStoryMusicUrl = musicUrl;
  var titleEl = document.getElementById('creator-music-name');
  if (titleEl) titleEl.innerText = title;
  closeAllSheets();
}

function addSticker(emoji) {
  var layer = document.getElementById('creator-overlay-layer');
  var el = document.createElement('div');
  el.className = 'creator-movable-element creator-sticker-element';
  el.innerText = emoji;
  el.style.top = '40%';
  el.style.left = '42%';
  layer.appendChild(el);
  makeElementDraggable(el);
  closeAllSheets();
}

function makeDraggableText(text) {
  var layer = document.getElementById('creator-overlay-layer');
  var el = document.createElement('div');
  el.className = 'creator-movable-element creator-text-element';
  el.innerText = text;
  el.style.top = '45%';
  el.style.left = '35%';
  layer.appendChild(el);
  makeElementDraggable(el);
}

function applyMediaFilter(filterValue) {
  currentAppliedFilter = filterValue;
  var media = document.getElementById('creator-target-media');
  if (media) media.style.filter = filterValue;
  closeAllSheets();
}

function makeElementDraggable(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  elmnt.onmousedown = dragMouseDown;
  elmnt.ontouchstart = dragTouchStart;

  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function dragTouchStart(e) {
    var touch = e.touches[0];
    pos3 = touch.clientX;
    pos4 = touch.clientY;
    document.ontouchend = closeDragElement;
    document.ontouchmove = elementTouchDrag;
  }

  function elementTouchDrag(e) {
    var touch = e.touches[0];
    pos1 = pos3 - touch.clientX;
    pos2 = pos4 - touch.clientY;
    pos3 = touch.clientX;
    pos4 = touch.clientY;
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
    document.ontouchend = null;
    document.ontouchmove = null;
  }
}

// 5. გაერთიანება და Cloudflare R2-ში გამოქვეყნება (Full Cover Canvas)
function publishCreatedStory() {
  if (!selectedStoryFile || !currentUser) {
    alert('გთხოვთ აირჩიოთ ფაილი და გაიაროთ ავტორიზაცია');
    return;
  }

  var btn = document.getElementById('story-publish-btn');
  if (btn) {
    btn.innerText = 'მუშავდება...';
    btn.disabled = true;
  }

  var isVideo = selectedStoryMediaType === 'video' || selectedStoryFile.type.startsWith('video/');

  if (!isVideo) {
    processStoryImageWithOverlays(function(finalBlob) {
      uploadStoryToR2(finalBlob, false, btn);
    });
  } else {
    uploadStoryToR2(selectedStoryFile, true, btn);
  }
}

function processStoryImageWithOverlays(callback) {
  var mediaZone = document.getElementById('creator-media-zone');
  var imgElement = document.getElementById('creator-target-media');
  var overlayLayer = document.getElementById('creator-overlay-layer');

  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');

  var img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imgElement.src;

  img.onload = function() {
    var zoneWidth = mediaZone.offsetWidth;
    var zoneHeight = mediaZone.offsetHeight;

    canvas.width = 1080;
    canvas.height = 1920;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (currentAppliedFilter && currentAppliedFilter !== 'none') {
      ctx.filter = currentAppliedFilter;
    }

    // Cover ალგორითმი სრული ეკრანისთვის
    var ratio = Math.max(canvas.width / img.width, canvas.height / img.height);
    var renderWidth = img.width * ratio;
    var renderHeight = img.height * ratio;
    var centerShiftX = (canvas.width - renderWidth) / 2;
    var centerShiftY = (canvas.height - renderHeight) / 2;

    ctx.drawImage(img, 0, 0, img.width, img.height, centerShiftX, centerShiftY, renderWidth, renderHeight);
    ctx.filter = 'none';

    var elements = overlayLayer.querySelectorAll('.creator-movable-element');
    var scaleX = canvas.width / zoneWidth;
    var scaleY = canvas.height / zoneHeight;

    elements.forEach(function(el) {
      var rect = el.getBoundingClientRect();
      var zoneRect = mediaZone.getBoundingClientRect();

      var relX = (rect.left - zoneRect.left) * scaleX;
      var relY = (rect.top - zoneRect.top) * scaleY;

      if (el.classList.contains('creator-sticker-element')) {
        ctx.font = `${54 * scaleX}px sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(el.innerText, relX, relY);
      } else if (el.classList.contains('creator-text-element')) {
        ctx.font = `bold ${24 * scaleX}px sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.shadowColor = "rgba(0,0,0,0.9)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = "#ffffff";
        ctx.fillText(el.innerText, relX, relY);
        ctx.shadowColor = "transparent";
      }
    });

    canvas.toBlob(function(blob) {
      callback(blob);
    }, 'image/jpeg', 0.95);
  };
}

function uploadStoryToR2(fileBlob, isVideo, btn) {
  if (btn) btn.innerText = 'იტვირთება...';

  var fileName = Date.now() + '_' + Math.random().toString(36).substring(2, 6) + (isVideo ? '.mp4' : '.jpg');
  var fileKey = 'stories/' + fileName;

  var r2S3 = new AWS.S3({
    endpoint: 'https://b06701b6405e891a274a6d40ae52c940.r2.cloudflarestorage.com',
    accessKeyId: 'fca43a92ab1d3b3e7c89912f8d525977',
    secretAccessKey: 'd051531e40a19cfaedade242eac6b6d506dad44be370224ba2e5c3ea298f1ad6',
    signatureVersion: 'v4',
    region: 'auto'
  });

  var contentType = isVideo ? 'video/mp4' : 'image/jpeg';

  var params = {
    Bucket: 'emigrantbook-videos',
    Key: fileKey,
    Body: fileBlob,
    ContentType: contentType
  };

  r2S3.putObject(params, function(err, data) {
    if (err) {
      console.error("Cloudflare Stories Upload Error:", err);
      alert("ატვირთვის შეცდომა: " + err.message);
      if (btn) {
        btn.innerText = 'გაზიარება';
        btn.disabled = false;
      }
      return;
    }

    var publicUrl = "https://pub-d077cb13f6ec46cebeca95f2f25b9a08.r2.dev/" + fileKey;

    db.collection('stories').add({
      user_id: currentUser.uid,
      media_url: publicUrl,
      media_type: isVideo ? "video" : "image",
      music_title: storyAttachedMusic || "Original Audio",
      music_url: selectedStoryMusicUrl || null,
      filter: currentAppliedFilter || "none",
      likes_count: 0,
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function() {
      alert('სიუჟეტი წარმატებით აიტვირთა!');
      closeStoryCreator();
      if (btn) {
        btn.innerText = 'გაზიარება';
        btn.disabled = false;
      }
      if (typeof loadStories === 'function') {
        loadStories();
      }
    }).catch(function(dbErr) {
      console.error("Firestore Error:", dbErr);
      alert("ბაზაში შენახვის შეცდომა: " + dbErr.message);
      if (btn) {
        btn.innerText = 'გაზიარება';
        btn.disabled = false;
      }
    });
  });
}

// 6. MULTI-STORY ჩატვირთვა და დაჯგუფება მთავარ გვერდზე
function fetchStoriesForUsers(userIdsList, listDiv) {
  if (!userIdsList || userIdsList.length === 0) return;
  var oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  db.collection('stories')
    .where('created_at', '>=', oneDayAgo)
    .orderBy('created_at', 'asc')
    .get()
    .then(function(snapshot) {
      var userStoriesMap = {};
      var authorIds = [];

      snapshot.forEach(function(doc) {
        var data = Object.assign({ id: doc.id }, doc.data());
        if (userIdsList.includes(data.user_id)) {
          if (!userStoriesMap[data.user_id]) {
            userStoriesMap[data.user_id] = [];
            authorIds.push(data.user_id);
          }
          userStoriesMap[data.user_id].push(data);
        }
      });

      var profileAvatar = document.getElementById('profile-big-avatar');
      if (profileAvatar) {
        var targetId = activeViewingProfileId || (currentUser ? currentUser.uid : null);
        if (userStoriesMap[targetId] && userStoriesMap[targetId].length > 0) {
          profileAvatar.style.border = "4px solid #dcae36";
        } else {
          profileAvatar.style.border = "4px solid #141414";
        }
      }

      if (authorIds.length === 0) return;

      fetchMultipleProfilesCached(authorIds, function() {
        authorIds.forEach(function(userId) {
          var stories = userStoriesMap[userId];
          var latestStory = stories[stories.length - 1];
          var author = cachedProfiles[userId] || {};
          var authorName = author.full_name || "User";
          var authorAvatar = author.avatar_url || null;
          var isOnline = isUserOnline(author);
          var initial = authorName ? authorName.charAt(0).toUpperCase() : "?";

          var dotHtml = isOnline ? `<div class="online-status-dot-sm"></div>` : ``;
          var avatarHtml = authorAvatar ? `<div class="avatar-has-online"><img src="${authorAvatar}" alt="Avatar" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">${dotHtml}</div>` : `<div class="avatar-has-online" style="display:flex; align-items:center; justify-content:center;">${initial}${dotHtml}</div>`;
          
          var backgroundHtml = latestStory.media_type === 'video' ? 
            `<video class="story-card-video-preview" src="${latestStory.media_url}#t=0.5" poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" preload="metadata" playsinline webkit-playsinline muted onvolumechange="this.muted=true"></video>` : 
            `<div style="width:100%; height:100%; background-image: url('${latestStory.media_url}'); background-size: cover; background-position: center;"></div>`;

          var card = document.createElement('div');
          card.className = "story-card friend-story-card";
          card.onclick = function() { 
            openStoryGroupViewer(stories, 0, authorName, authorAvatar); 
          };

          card.innerHTML = `
            <div class="story-badge-avatar">${avatarHtml}</div>
            ${backgroundHtml}
            <span class="story-username-label">${authorName}</span>
          `;
          listDiv.appendChild(card);
        });
      });
    }).catch(function(error) {
      console.error("Error loading stories: ", error);
    });
}
