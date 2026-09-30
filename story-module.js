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

    /* 🏷️ მუსიკის მრავალფეროვანი სტიკერები (INSTAGRAM/FB STYLES) */
    .creator-music-sticker {
      padding: 0 !important;
      cursor: move;
      user-select: none;
      filter: drop-shadow(0 8px 25px rgba(0,0,0,0.65));
      transition: transform 0.15s ease;
    }
    .creator-music-sticker:active { transform: scale(0.97); }

    /* Style 1: Big Cover Card */
    .music-sticker-card {
      display: flex; align-items: center; gap: 12px;
      background: rgba(20, 20, 20, 0.75); backdrop-filter: blur(25px);
      -webkit-backdrop-filter: blur(25px); border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 16px; padding: 10px 14px; max-width: 290px;
    }
    .music-sticker-card-cover {
      width: 48px; height: 48px; border-radius: 10px; object-fit: cover;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4); flex-shrink: 0;
    }
    .music-sticker-card-meta {
      display: flex; flex-direction: column; overflow: hidden; flex: 1;
    }
    .music-sticker-card-title {
      font-size: 14.5px; font-weight: 800; color: #fff; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis;
    }
    .music-sticker-card-artist {
      font-size: 12px; font-weight: 500; color: rgba(255, 255, 255, 0.75);
      margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .music-wave-bars {
      display: flex; align-items: flex-end; gap: 2.5px; height: 16px; margin-left: 4px; flex-shrink: 0;
    }
    .music-wave-bar {
      width: 3px; background: #fff; border-radius: 2px;
      animation: soundWaveAnim 1s infinite alternate ease-in-out;
    }
    .music-wave-bar:nth-child(1) { height: 6px; animation-delay: 0.1s; }
    .music-wave-bar:nth-child(2) { height: 16px; animation-delay: 0.3s; }
    .music-wave-bar:nth-child(3) { height: 10px; animation-delay: 0.2s; }
    .music-wave-bar:nth-child(4) { height: 14px; animation-delay: 0.4s; }
    @keyframes soundWaveAnim {
      0% { height: 4px; }
      100% { height: 16px; }
    }

    /* Style 2: Compact Pill */
    .music-sticker-pill {
      display: flex; align-items: center; gap: 8px;
      background: rgba(255, 255, 255, 0.95); color: #000;
      border-radius: 24px; padding: 6px 14px 6px 8px; max-width: 250px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.5);
    }
    .music-sticker-pill-cover {
      width: 28px; height: 28px; border-radius: 50%; object-fit: cover; flex-shrink: 0;
    }
    .music-sticker-pill-text {
      font-size: 13px; font-weight: 700; color: #000; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis;
    }

    /* Style 3: Vinyl Disc */
    .music-sticker-vinyl {
      display: flex; align-items: center; gap: 10px;
      background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(15px);
      border-radius: 30px; padding: 6px 14px 6px 6px; border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .vinyl-disc {
      width: 38px; height: 38px; border-radius: 50%; background: #111;
      border: 3px solid #333; position: relative; display: flex;
      align-items: center; justify-content: center;
      animation: vinylSpin 3s linear infinite; flex-shrink: 0;
    }
    .vinyl-disc-img { width: 18px; height: 18px; border-radius: 50%; object-fit: cover; }
    @keyframes vinylSpin { 100% { transform: rotate(360deg); } }

    .music-sticker-del-btn {
      position: absolute; top: -8px; right: -8px; width: 22px; height: 22px;
      background: #ff3b30; color: #fff; border-radius: 50%; border: 2px solid #fff;
      display: flex; align-items: center; justify-content: center; font-size: 11px;
      font-weight: bold; cursor: pointer; z-index: 10;
    }

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
      position: absolute; bottom: 0; left: 0; right: 0; max-height: 70vh;
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

    /* მუსიკის სია */
    .fb-music-search-box {
      display: flex; align-items: center; background: #2f3031;
      border-radius: 20px; padding: 8px 14px; margin-bottom: 8px;
    }
    .fb-music-search-input {
      width: 100%; background: transparent; border: none; outline: none;
      color: #fff; font-size: 14px; margin-left: 8px;
    }
    .fb-music-track-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 10px; background: #242526; border-radius: 12px; cursor: pointer;
      transition: background 0.15s;
    }
    .fb-music-track-row:hover, .fb-music-track-row:active { background: #3a3b3c; }
    .fb-music-track-left { display: flex; align-items: center; gap: 12px; flex: 1; overflow: hidden; }
    .fb-track-list-cover {
      width: 44px; height: 44px; border-radius: 8px; object-fit: cover; background: #333; flex-shrink: 0;
    }
    .fb-music-item-info { display: flex; flex-direction: column; color: #fff; font-size: 13.5px; overflow: hidden; }
    .fb-music-item-info span:first-child { font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .fb-music-item-info span:last-child { font-size: 11.5px; color: #b0b3b8; margin-top: 2px; }
    .fb-music-play-btn {
      width: 36px; height: 36px; border-radius: 50%; background: #3a3b3c;
      border: none; color: #fff; display: flex; align-items: center; justify-content: center;
      cursor: pointer; flex-shrink: 0; font-size: 14px;
    }
    
    /* ✂️ თანამედროვე FB/IG WAVEFORM TRIMMER (30 წმ) */
    .fb-music-trimmer-box {
      position: absolute; bottom: 0; left: 0; right: 0;
      background: rgba(18, 18, 18, 0.96); backdrop-filter: blur(25px);
      -webkit-backdrop-filter: blur(25px); padding: 18px 20px 24px 20px;
      border-radius: 20px 20px 0 0; z-index: 70; display: none; flex-direction: column; gap: 14px;
      box-shadow: 0 -10px 35px rgba(0,0,0,0.85);
    }
    .trimmer-top-row { display: flex; justify-content: space-between; align-items: center; color: #fff; }
    .trimmer-title-box { display: flex; align-items: center; gap: 10px; max-width: 75%; }
    .trimmer-cover-small { width: 34px; height: 34px; border-radius: 6px; object-fit: cover; }
    .trimmer-title { font-size: 14px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .trimmer-duration-badge {
      background: linear-gradient(135deg, #1877f2, #00c6ff);
      color: #fff; font-size: 11.5px; font-weight: 800; padding: 4px 10px; border-radius: 12px;
    }

    /* Waveform visual */
    .trimmer-wave-visual {
      display: flex; align-items: center; justify-content: space-between;
      height: 38px; gap: 2px; padding: 0 4px; opacity: 0.85;
    }
    .trim-wave-bar {
      flex: 1; background: #555; border-radius: 3px; min-height: 4px;
      transition: background 0.15s, height 0.15s;
    }
    .trim-wave-bar.active-zone { background: #1877f2; }

    .trimmer-slider-wrap { display: flex; flex-direction: column; gap: 8px; }
    .trimmer-slider {
      width: 100%; -webkit-appearance: none; appearance: none;
      height: 6px; border-radius: 4px; background: #2f3031; outline: none;
    }
    .trimmer-slider::-webkit-slider-thumb {
      -webkit-appearance: none; appearance: none; width: 22px; height: 22px;
      border-radius: 50%; background: #fff; cursor: pointer;
      box-shadow: 0 0 12px rgba(24, 119, 242, 0.8); border: 3px solid #1877f2;
    }
    .trimmer-time-labels { display: flex; justify-content: space-between; color: #b0b3b8; font-size: 12px; font-weight: 600; }
    .trimmer-done-btn {
      background: #1877f2; color: #fff; border: none; border-radius: 10px;
      height: 42px; font-size: 15px; font-weight: 700; cursor: pointer;
      box-shadow: 0 4px 15px rgba(24, 119, 242, 0.4);
    }
    .trimmer-done-btn:active { background: #166fe5; }

    .fb-stickers-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 10px 0; }
    .fb-sticker-btn { background: #242526; border: none; border-radius: 12px; font-size: 32px; padding: 10px; cursor: pointer; }
    .fb-sticker-btn:hover { background: #3a3b3c; }

    .fb-filters-grid { display: flex; gap: 10px; overflow-x: auto; padding: 10px 0; }
    .fb-filter-pill {
      background: #242526; color: #fff; border: 1px solid #444;
      padding: 8px 16px; border-radius: 20px; white-space: nowrap; cursor: pointer; font-size: 13px;
    }

    /* STORY BOTTOM ACTION SHEET */
    .story-options-backdrop {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0, 0, 0, 0.6); z-index: 1000002;
      display: flex; align-items: flex-end; justify-content: center;
    }
    .story-options-sheet {
      width: 100%; max-width: 440px; background: #242526;
      border-radius: 16px 16px 0 0; padding: 12px 16px 24px 16px;
      display: flex; flex-direction: column; gap: 8px;
      animation: storySheetUp 0.2s ease-out; box-shadow: 0 -4px 20px rgba(0,0,0,0.6);
    }
    @keyframes storySheetUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    .story-sheet-drag-bar {
      width: 40px; height: 4px; background: #555;
      border-radius: 4px; margin: 0 auto 8px auto;
    }
    .story-sheet-action-row {
      display: flex; align-items: center; gap: 14px; padding: 12px 8px;
      border-radius: 8px; cursor: pointer; color: #e4e6eb; font-size: 15px; font-weight: 600;
    }
    .story-sheet-action-row:active { background: #3a3b3c; }
    .story-sheet-action-row.delete-action { color: #ff4d4f; }
    .story-sheet-icon {
      width: 36px; height: 36px; border-radius: 50%; background: #3a3b3c;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .story-sheet-action-row.delete-action .story-sheet-icon { background: rgba(255, 77, 79, 0.15); }
    .story-sheet-action-row.delete-action svg { stroke: #ff4d4f; }

    /* CONFIRM DIALOG */
    .story-confirm-modal {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.7); z-index: 1000003;
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .story-confirm-box {
      width: 100%; max-width: 320px; background: #242526; border-radius: 14px;
      padding: 20px; text-align: center; color: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.8);
    }
    .story-confirm-title { font-size: 17px; font-weight: 700; margin-bottom: 8px; }
    .story-confirm-desc { font-size: 13.5px; color: #b0b3b8; margin-bottom: 20px; line-height: 1.4; }
    .story-confirm-btns { display: flex; gap: 10px; }
    .story-confirm-btn {
      flex: 1; padding: 10px; border-radius: 8px; border: none;
      font-size: 14.5px; font-weight: 600; cursor: pointer;
    }
    .story-cancel-btn { background: #3a3b3c; color: #fff; }
    .story-danger-btn { background: #e41e3f; color: #fff; }
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
    <input type="file" id="story-file-input" accept="image/*,video/*" style="display: none;" onchange="handleStoryFileSelected(event)">

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
              <span class="fb-music-sub">GitHub ბიბლიოთეკა</span>
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

        <!-- 🎵 მუსიკის არჩევის Facebook მოდალი -->
        <div id="sheet-music" class="fb-sheet-modal">
          <div class="fb-sheet-header">
            <span>მუსიკის არჩევა</span>
            <button class="fb-sheet-close" onclick="closeSheet('sheet-music')">✕</button>
          </div>
          <div class="fb-music-search-box">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#b0b3b8" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" class="fb-music-search-input" id="musicSearchInput" placeholder="მოძებნეთ სიმღერა ან შემსრულებელი..." oninput="filterStoryMusic(this.value)">
          </div>
          <div class="fb-sheet-list" id="storyMusicTrackList">
            <!-- ჩაიტვირთება დინამიკურად JS-ით -->
          </div>
        </div>

        <!-- ✂️ FB/IG WAVEFORM TRIMMER ბანერი -->
        <div id="story-music-trimmer" class="fb-music-trimmer-box">
          <div class="trimmer-top-row">
            <div class="trimmer-title-box">
              <img id="trimmer-cover-img" src="" class="trimmer-cover-small" alt="cover">
              <span class="trimmer-title" id="trimmer-song-title">სიმღერის სახელი</span>
            </div>
            <span class="trimmer-duration-badge">30 წმ</span>
          </div>

          <!-- Waveform ანიმაცია -->
          <div class="trimmer-wave-visual" id="trimmerWaveBars"></div>

          <div class="trimmer-slider-wrap">
            <input type="range" id="musicRangeSlider" class="trimmer-slider" min="0" value="0" step="1" oninput="onMusicSliderChange(this.value)">
            <div class="trimmer-time-labels">
              <span id="trimmer-current-time">0:00</span>
              <span id="trimmer-end-time">0:30</span>
            </div>
          </div>
          <button class="trimmer-done-btn" onclick="saveMusicTrimSelection()">მზადაა</button>
        </div>

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

    <div id="story-viewer-modal" class="story-viewer-overlay" style="display: none;" onclick="closeStoryViewer()">
      <div class="fb-story-frame" onclick="event.stopPropagation()">
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
            <button class="fb-story-head-btn" onclick="openStoryActionSheet(event)" title="More">•••</button>
          </div>
        </div>

        <div class="fb-story-media-view" id="sv-media-container" onmousedown="pauseStoryTimer()" onmouseup="resumeStoryTimer()" ontouchstart="pauseStoryTimer()" ontouchend="resumeStoryTimer()">
          <div class="story-tap-zone-left" onclick="goToPrevStoryItem(event)"></div>
          <div class="story-tap-zone-right" onclick="goToNextStoryItem(event)"></div>
        </div>
        
        <div id="story-floating-reactions-zone" class="story-floating-reactions"></div>

        <div class="fb-story-footer">
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

    <!-- სთორის პარამეტრების ქვედა ბანერი (Bottom Sheet) -->
    <div id="story-options-modal" class="story-options-backdrop" style="display: none;" onclick="closeStoryActionSheet()">
      <div class="story-options-sheet" onclick="event.stopPropagation()">
        <div class="story-sheet-drag-bar"></div>
        <div id="story-sheet-content"></div>
      </div>
    </div>

    <!-- წაშლის დადასტურების მოდალი -->
    <div id="story-delete-confirm-modal" class="story-confirm-modal" style="display: none;">
      <div class="story-confirm-box">
        <div class="story-confirm-title">სთორის წაშლა?</div>
        <div class="story-confirm-desc">ნამდვილად გსურთ ამ სთორის წაშლა? ამ მოქმედების გაუქმება შეუძლებელია.</div>
        <div class="story-confirm-btns">
          <button class="story-confirm-btn story-cancel-btn" onclick="closeStoryDeleteConfirm()">გაუქმება</button>
          <button class="story-confirm-btn story-danger-btn" onclick="confirmDeleteActiveStory()">წაშლა</button>
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

  // წინა ტაიმერისა და მუსიკის გასუფთავება
  clearInterval(storyProgressInterval);
  storyAudioPlayer.pause();

  if (mediaContainer) {
    var tapZones = `
      <div class="story-tap-zone-left" onclick="goToPrevStoryItem(event)"></div>
      <div class="story-tap-zone-right" onclick="goToNextStoryItem(event)"></div>
    `;

    if (story.media_type === 'video') {
      mediaContainer.innerHTML = tapZones + `<video id="active-story-video" src="${story.media_url}" poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" autoplay playsinline webkit-playsinline preload="auto" style="width:100%; height:100%; object-fit:cover !important; filter: ${story.filter || 'none'};"></video>`;

      var activeVid = document.getElementById('active-story-video');

      if (activeVid) {
        activeVid.muted = false;

        activeVid.onloadedmetadata = function() {
          var durationMs = (activeVid.duration && !isNaN(activeVid.duration)) ? (activeVid.duration * 1000) : 12000;
          startStoryProgressBar(durationMs, username, avatarUrl);
        };

        activeVid.onerror = function() {
          startStoryProgressBar(6000, username, avatarUrl);
        };
      }
    } else {
      mediaContainer.innerHTML = tapZones + `<img src="${story.media_url}" alt="Story Image" style="width:100%; height:100%; object-fit:cover !important; filter: ${story.filter || 'none'};">`;

      // 🎯 მუსიკის დაკვრა არჩეული წამიდან და 30 წამიანი სინქრონიზაცია
      var photoDuration = 7000;
      if (story.music_url) {
        photoDuration = 30000;
        storyAudioPlayer.src = story.music_url;
        var startSec = Number(story.music_start_time) || 0;
        storyAudioPlayer.currentTime = startSec;
        storyAudioPlayer.play().catch(function(){});
      }

      startStoryProgressBar(photoDuration, username, avatarUrl);
    }
  }
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

// ➕ სთორის ყურებისას პლიუსზე დაჭერა
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

// 💬 დამხმარე ფუნქცია: მესინჯერში სთორის ბარათით გაგზავნა
function sendStoryInteractionToMessenger(story, textContent) {
  var myUid = (typeof currentUser !== 'undefined' && currentUser) ? currentUser.uid : (firebase.auth().currentUser ? firebase.auth().currentUser.uid : null);
  if (!myUid || !story || !story.user_id) return;

  var authorId = story.user_id;
  var chatId = myUid < authorId ? (myUid + '_' + authorId) : (authorId + '_' + myUid);
  var serverTimestamp = firebase.firestore.FieldValue.serverTimestamp();

  var storyCreatedMs = story.created_at && story.created_at.toMillis ? story.created_at.toMillis() : (story.created_at && story.created_at.seconds ? story.created_at.seconds * 1000 : Date.now());

  db.collection('chats').doc(chatId).collection('messages').add({
    senderId: myUid,
    text: textContent,
    read: false,
    type: 'story_reply',
    story_id: story.id || null,
    story_media_url: story.media_url || null,
    story_media_type: story.media_type || 'image',
    story_created_ms: storyCreatedMs,
    createdAt: serverTimestamp,
    created_at: serverTimestamp
  }).then(function() {
    console.log("სთორის პასუხი წარმატებით ჩაიწერა მესინჯერში");
  }).catch(function(err) {
    console.error("მესინჯერის შეცდომა:", err);
  });
}

// 1. სთორის რეაქცია
function reactToStoryFacebook(emoji) {
  var story = activeUserStoryGroup[activeStoryIndex];
  if (!story) return;

  var zone = document.getElementById('story-floating-reactions-zone');
  if (zone) {
    var el = document.createElement('div');
    el.className = 'flying-story-emoji';
    el.innerText = emoji;
    zone.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }

  var newLikes = (story.likes_count || 0) + 1;
  db.collection('stories').doc(story.id).update({ likes_count: newLikes }).catch(function(){});
  sendStoryInteractionToMessenger(story, emoji);
}

// 2. სთორის ქვედა ველიდან ტექსტური პასუხის გაგზავნა
function handleStoryCommentKeyPress(event) {
  if (event.key === 'Enter') {
    var input = document.getElementById('story-comment-field');
    var story = activeUserStoryGroup[activeStoryIndex];
    if (!input || !story) return;

    var text = input.value.trim();
    if (!text) return;

    sendStoryInteractionToMessenger(story, text);
    input.value = "";
    input.blur();
    resumeStoryTimer();
    alert("შეტყობინება გაიგზავნა მესინჯერში!");
  }
}

// 4. CREATOR LOGIC, MUSIC, STYLES & MERGE
var selectedStoryFile = null;
var selectedStoryMediaType = null;
var storyAttachedMusic = "Original Audio";
var selectedStoryMusicUrl = null;
var selectedStoryMusicCover = null;
var currentAppliedFilter = "none";
var currentMusicStickerStyle = 1; // 1: Card, 2: Pill, 3: Vinyl

// 🎵 GITHUB MUSIC REPOSITORY ბიბლიოთეკა ალბომის ყდებით (Covers)
var githubMusicLibrary = [
  {
    id: "gm1",
    title: "Мелодия души",
    artist: "Новая песня 2025",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=80",
    url: "https://github.com/jimsher/Emigrantbook/raw/refs/heads/main/music/%F0%9F%92%96%20%D0%9C%D0%95%D0%9B%D0%9E%D0%94%D0%98%D0%AF%20%D0%94%D0%A3%D0%A8%D0%98%20-%20%D0%9D%D0%9E%D0%92%D0%90%D0%AF%20%D0%9F%D0%95%D0%A1%D0%9D%D0%AF%202025%20%F0%9F%8E%B5%20(160k)_1767641969628.oga"
  },
  {
    id: "gm2",
    title: "არ შემიყვარო ქალო",
    artist: "უცნობი",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&auto=format&fit=crop&q=80",
    url: "https://github.com/jimsher/Emigrantbook/raw/refs/heads/main/music/%E1%83%90%E1%83%A0%20%E1%83%A8%E1%83%94%E1%83%9B%E1%83%98%E1%83%A7%E1%83%95%E1%83%90%E1%83%A0%E1%83%9D%20%E1%83%A5%E1%83%90%E1%83%A0%E1%83%9D.m4a"
  },
  {
    id: "gm3",
    title: "2026. წლის",
    artist: "Sabrina Carpenter",
    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&auto=format&fit=crop&q=80",
    url: "https://github.com/jimsher/Emigrantbook/raw/refs/heads/main/music/2026%20%E1%83%AC%E1%83%9A%E1%83%98%E1%83%A1.m4a"
  },
  {
    id: "gm4",
    title: "ბოლომდე აუწიეთ",
    artist: "The Weeknd",
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80",
    url: "https://github.com/jimsher/Emigrantbook/raw/refs/heads/main/music/%E1%83%91%E1%83%9D%E1%83%9A%E1%83%9D%E1%83%9B%E1%83%93%E1%83%94%20%E1%83%90%E1%83%A3%E1%83%AC%E1%83%98%E1%83%94%E1%83%97.m4a"
  },
  {
    id: "gm5",
    title: "ლადო კუჭუხიძე",
    artist: "Miley Cyrus",
    cover: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=150&auto=format&fit=crop&q=80",
    url: "https://github.com/jimsher/Emigrantbook/raw/refs/heads/main/music/%E1%83%9A%E1%83%90%E1%83%93%E1%83%9D%20%E1%83%99%E1%83%A3%E1%83%AD%E1%83%A3%E1%83%AE%E1%83%98%E1%83%AB%E1%83%94.m4a"
  },
   {
   id: "gm6",
    title: "შმაგი მეძმარაშვილი",
    artist: "Miley Cyrus",
    cover: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=150&auto=format&fit=crop&q=80",
    url: "https://github.com/jimsher/Emigrantbook/raw/refs/heads/main/music/%E1%83%A8%E1%83%9B%E1%83%90%E1%83%92%E1%83%98%20%E1%83%9B%E1%83%94%E1%83%AB%E1%83%9B%E1%83%90%E1%83%A0%E1%83%98%E1%83%90%E1%83%A8%E1%83%95%E1%83%98%E1%83%9A%E1%83%98.m4a"
  }
];

var previewAudioPlayer = new Audio();
var currentlyPlayingTrackId = null;
var activeTrimmingTrack = null;
var selectedMusicStartTime = 0;
var STORY_CLIP_MAX_SEC = 30;
var trimmerAudioPlayer = new Audio();
var trimmerLoopInterval = null;

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
  selectedStoryMusicCover = null;
  selectedMusicStartTime = 0;
  currentMusicStickerStyle = 1;

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
  stopMusicPreviews();
}

function resetStoryEdits() {
  var overlayLayer = document.getElementById('creator-overlay-layer');
  if (overlayLayer) overlayLayer.innerHTML = '';
  applyMediaFilter('none');
  storyAttachedMusic = "Original Audio";
  selectedStoryMusicUrl = null;
  selectedStoryMusicCover = null;
  selectedMusicStartTime = 0;
  currentMusicStickerStyle = 1;
  var titleEl = document.getElementById('creator-music-name');
  if (titleEl) titleEl.innerText = "მუსიკის დამატება";
  stopMusicPreviews();
}

function stopMusicPreviews() {
  previewAudioPlayer.pause();
  previewAudioPlayer.src = "";
  currentlyPlayingTrackId = null;
  trimmerAudioPlayer.pause();
  trimmerAudioPlayer.src = "";
  clearInterval(trimmerLoopInterval);
}

function openStoryTool(toolType) {
  closeAllSheets();
  if (toolType === 'text') {
    var userText = prompt('შეიყვანეთ ტექსტი:');
    if (userText) makeDraggableText(userText);
  } else if (toolType === 'music') {
    var sheet = document.getElementById('sheet-music');
    if (sheet) {
      sheet.style.display = 'flex';
      renderMusicTrackList(githubMusicLibrary);
    }
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
  stopMusicPreviews();
  var sheet = document.getElementById(id);
  if (sheet) sheet.style.display = 'none';
}

function closeAllSheets() {
  stopMusicPreviews();
  document.querySelectorAll('.fb-sheet-modal').forEach(el => el.style.display = 'none');
  var trimmer = document.getElementById('story-music-trimmer');
  if (trimmer) trimmer.style.display = 'none';
}

// 🎶 მუსიკის ძიება და რენდერი (ალბომის ყდებით)
function renderMusicTrackList(tracks) {
  var container = document.getElementById('storyMusicTrackList');
  if (!container) return;
  container.innerHTML = '';

  if (tracks.length === 0) {
    container.innerHTML = '<div style="color:#b0b3b8; padding:15px; text-align:center;">მუსიკა ვერ მოიძებნა</div>';
    return;
  }

  tracks.forEach(function(track) {
    var isPlaying = currentlyPlayingTrackId === track.id;
    var row = document.createElement('div');
    row.className = 'fb-music-track-row';
    var coverImg = track.cover || 'icons/circle-user-round.svg';

    row.innerHTML = `
      <div class="fb-music-track-left" onclick="startTrimmingTrack('${track.id}')">
        <img src="${coverImg}" class="fb-track-list-cover" alt="cover">
        <div class="fb-music-item-info">
          <span>${track.title}</span>
          <span>${track.artist}</span>
        </div>
      </div>
      <button class="fb-music-play-btn" onclick="toggleTrackPreview(event, '${track.id}', '${track.url}')">
        ${isPlaying ? '⏸' : '▶'}
      </button>
    `;
    container.appendChild(row);
  });
}

function filterStoryMusic(query) {
  var clean = (query || '').toLowerCase().trim();
  var filtered = githubMusicLibrary.filter(function(t) {
    return t.title.toLowerCase().includes(clean) || t.artist.toLowerCase().includes(clean);
  });
  renderMusicTrackList(filtered);
}

function toggleTrackPreview(event, trackId, url) {
  event.stopPropagation();
  if (currentlyPlayingTrackId === trackId) {
    previewAudioPlayer.pause();
    currentlyPlayingTrackId = null;
  } else {
    previewAudioPlayer.src = url;
    previewAudioPlayer.currentTime = 0;
    previewAudioPlayer.play().catch(function(){});
    currentlyPlayingTrackId = trackId;
  }
  var query = document.getElementById('musicSearchInput') ? document.getElementById('musicSearchInput').value : '';
  filterStoryMusic(query);
}

// ✂️ Facebook/Instagram Waveform Trimmer
function generateWaveformBars() {
  var container = document.getElementById('trimmerWaveBars');
  if (!container) return;
  container.innerHTML = '';
  // 35 ვიზუალური ტალღის ზოლი
  for (var i = 0; i < 35; i++) {
    var h = Math.floor(Math.random() * 26) + 8;
    var bar = document.createElement('div');
    bar.className = 'trim-wave-bar';
    bar.style.height = h + 'px';
    container.appendChild(bar);
  }
}

function updateWaveformHighlight(currentSec, totalSec) {
  var bars = document.querySelectorAll('.trim-wave-bar');
  if (!bars || bars.length === 0) return;
  var ratio = totalSec > 0 ? (currentSec / totalSec) : 0;
  var startIdx = Math.floor(ratio * bars.length);
  var activeLen = Math.floor((STORY_CLIP_MAX_SEC / (totalSec || 60)) * bars.length) || 8;

  bars.forEach(function(bar, idx) {
    if (idx >= startIdx && idx <= startIdx + activeLen) {
      bar.classList.add('active-zone');
    } else {
      bar.classList.remove('active-zone');
    }
  });
}

function startTrimmingTrack(trackId) {
  stopMusicPreviews();
  closeSheet('sheet-music');

  var track = githubMusicLibrary.find(t => t.id === trackId);
  if (!track) return;
  activeTrimmingTrack = track;

  trimmerAudioPlayer.src = track.url;
  trimmerAudioPlayer.load();

  trimmerAudioPlayer.onloadedmetadata = function() {
    var totalSec = Math.floor(trimmerAudioPlayer.duration) || 60;
    var slider = document.getElementById('musicRangeSlider');
    slider.max = Math.max(0, totalSec - STORY_CLIP_MAX_SEC);
    slider.value = 0;
    selectedMusicStartTime = 0;

    document.getElementById('trimmer-song-title').innerText = track.title + " • " + track.artist;
    var coverEl = document.getElementById('trimmer-cover-img');
    if (coverEl) coverEl.src = track.cover || 'icons/circle-user-round.svg';

    generateWaveformBars();
    updateWaveformHighlight(0, totalSec);
    updateTrimmerTimeLabels(0);

    var trimmer = document.getElementById('story-music-trimmer');
    if (trimmer) trimmer.style.display = 'flex';

    playTrimLoop(0);
  };

  trimmerAudioPlayer.onerror = function() {
    alert("მუსიკის ჩატვირთვა ვერ მოხერხდა GitHub-იდან.");
  };
}

function onMusicSliderChange(val) {
  selectedMusicStartTime = parseInt(val, 10);
  var totalSec = Math.floor(trimmerAudioPlayer.duration) || 60;
  updateWaveformHighlight(selectedMusicStartTime, totalSec);
  updateTrimmerTimeLabels(selectedMusicStartTime);
  playTrimLoop(selectedMusicStartTime);
}

function updateTrimmerTimeLabels(sec) {
  var endSec = sec + STORY_CLIP_MAX_SEC;
  document.getElementById('trimmer-current-time').innerText = formatTrimmerTime(sec);
  document.getElementById('trimmer-end-time').innerText = formatTrimmerTime(endSec);
}

function formatTrimmerTime(sec) {
  var m = Math.floor(sec / 60);
  var s = sec % 60;
  return m + ":" + (s < 10 ? "0" : "") + s;
}

function playTrimLoop(startSec) {
  trimmerAudioPlayer.currentTime = startSec;
  trimmerAudioPlayer.play().catch(function(){});

  clearInterval(trimmerLoopInterval);
  trimmerLoopInterval = setInterval(function() {
    if (trimmerAudioPlayer.currentTime >= startSec + STORY_CLIP_MAX_SEC) {
      trimmerAudioPlayer.currentTime = startSec;
      trimmerAudioPlayer.play().catch(function(){});
    }
  }, 400);
}

// 🎯 „მზადაა“ -> მუსიკის დამახსოვრება და მოძრავი სტიკერის განთავსება
function saveMusicTrimSelection() {
  stopMusicPreviews();
  var trimmer = document.getElementById('story-music-trimmer');
  if (trimmer) trimmer.style.display = 'none';

  if (!activeTrimmingTrack) return;

  storyAttachedMusic = activeTrimmingTrack.title + " • " + activeTrimmingTrack.artist;
  selectedStoryMusicUrl = activeTrimmingTrack.url;
  selectedStoryMusicCover = activeTrimmingTrack.cover || null;

  var topMusicName = document.getElementById('creator-music-name');
  if (topMusicName) topMusicName.innerText = activeTrimmingTrack.title;

  renderMusicStickerOnStory();
}

// 🎨 მუსიკის სტიკერის რენდერი (სტილის გადართვით)
function renderMusicStickerOnStory() {
  var overlayLayer = document.getElementById('creator-overlay-layer');
  if (!overlayLayer || !activeTrimmingTrack) return;

  var old = overlayLayer.querySelector('.creator-music-sticker');
  var prevTop = old ? old.style.top : '22%';
  var prevLeft = old ? old.style.left : '14%';
  if (old) old.remove();

  var sticker = document.createElement('div');
  sticker.className = 'creator-movable-element creator-music-sticker';
  sticker.style.top = prevTop;
  sticker.style.left = prevLeft;
  sticker.setAttribute('data-style', currentMusicStickerStyle);

  var cover = activeTrimmingTrack.cover || 'icons/circle-user-round.svg';
  var title = activeTrimmingTrack.title;
  var artist = activeTrimmingTrack.artist;

  var innerContent = '';

  if (currentMusicStickerStyle === 1) {
    // Style 1: Big Card with Album Cover & Sound Waves
    innerContent = `
      <div class="music-sticker-card" onclick="toggleMusicStickerStyle(event)">
        <img src="${cover}" class="music-sticker-card-cover" alt="cover">
        <div class="music-sticker-card-meta">
          <span class="music-sticker-card-title">${title}</span>
          <span class="music-sticker-card-artist">${artist}</span>
        </div>
        <div class="music-wave-bars">
          <div class="music-wave-bar"></div>
          <div class="music-wave-bar"></div>
          <div class="music-wave-bar"></div>
          <div class="music-wave-bar"></div>
        </div>
      </div>
    `;
  } else if (currentMusicStickerStyle === 2) {
    // Style 2: Compact White Pill
    innerContent = `
      <div class="music-sticker-pill" onclick="toggleMusicStickerStyle(event)">
        <img src="${cover}" class="music-sticker-pill-cover" alt="cover">
        <span class="music-sticker-pill-text">${title} •${artist}</span>
      </div>
    `;
  } else if (currentMusicStickerStyle === 3) {
    // Style 3: Vinyl Disc Style
    innerContent = `
      <div class="music-sticker-vinyl" onclick="toggleMusicStickerStyle(event)">
        <div class="vinyl-disc">
          <img src="${cover}" class="vinyl-disc-img" alt="cover">
        </div>
        <span style="color:#fff; font-size:13px; font-weight:700;">${title}</span>
      </div>
    `;
  }

  sticker.innerHTML = innerContent + `<div class="music-sticker-del-btn" onclick="removeAttachedStoryMusic(event)">✕</div>`;
  overlayLayer.appendChild(sticker);
  makeElementDraggable(sticker);
}

// სტიკერზე დაჭერით სტილის შეცვლა (1 -> 2 -> 3 -> 1)
function toggleMusicStickerStyle(event) {
  event.stopPropagation();
  currentMusicStickerStyle = currentMusicStickerStyle >= 3 ? 1 : (currentMusicStickerStyle + 1);
  renderMusicStickerOnStory();
}

function removeAttachedStoryMusic(event) {
  if (event) event.stopPropagation();
  var overlayLayer = document.getElementById('creator-overlay-layer');
  if (overlayLayer) {
    var sticker = overlayLayer.querySelector('.creator-music-sticker');
    if (sticker) sticker.remove();
  }
  storyAttachedMusic = "Original Audio";
  selectedStoryMusicUrl = null;
  selectedStoryMusicCover = null;
  selectedMusicStartTime = 0;
  activeTrimmingTrack = null;
  var topMusicName = document.getElementById('creator-music-name');
  if (topMusicName) topMusicName.innerText = "მუსიკის დამატება";
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
  var isMoved = false;

  elmnt.onmousedown = dragMouseDown;
  elmnt.ontouchstart = dragTouchStart;

  function dragMouseDown(e) {
    if (e.target.classList.contains('music-sticker-del-btn')) return;
    isMoved = false;
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e.preventDefault();
    isMoved = true;
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function dragTouchStart(e) {
    if (e.target.classList.contains('music-sticker-del-btn')) return;
    isMoved = false;
    var touch = e.touches[0];
    pos3 = touch.clientX;
    pos4 = touch.clientY;
    document.ontouchend = closeDragElement;
    document.ontouchmove = elementTouchDrag;
  }

  function elementTouchDrag(e) {
    isMoved = true;
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

    // ასინქრონულად ვხატავთ სტიკერებს (ალბომის ყდიანად)
    var pendingDraws = elements.length;

    if (pendingDraws === 0) {
      canvas.toBlob(b => callback(b), 'image/jpeg', 0.95);
      return;
    }

    function checkFinished() {
      pendingDraws--;
      if (pendingDraws <= 0) {
        canvas.toBlob(b => callback(b), 'image/jpeg', 0.95);
      }
    }

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
        checkFinished();
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
        checkFinished();
      } else if (el.classList.contains('creator-music-sticker')) {
        // მუსიკის სტიკერის ხატვა Canvas-ზე
        var coverImgEl = el.querySelector('img');
        var title = activeTrimmingTrack ? activeTrimmingTrack.title : 'Music';
        var artist = activeTrimmingTrack ? activeTrimmingTrack.artist : '';

        var coverToDraw = new Image();
        coverToDraw.crossOrigin = "anonymous";
        coverToDraw.src = coverImgEl ? coverImgEl.src : (activeTrimmingTrack ? activeTrimmingTrack.cover : '');

        coverToDraw.onload = function() {
          if (currentMusicStickerStyle === 1) {
            // Big Card
            var cardW = 320 * scaleX;
            var cardH = 76 * scaleY;
            ctx.fillStyle = "rgba(20, 20, 20, 0.85)";
            ctx.beginPath();
            ctx.roundRect(relX, relY, cardW, cardH, 16 * scaleX);
            ctx.fill();

            // Cover
            ctx.drawImage(coverToDraw, relX + (12 * scaleX), relY + (10 * scaleY), 56 * scaleX, 56 * scaleY);

            // Title & Artist
            ctx.fillStyle = "#ffffff";
            ctx.font = `bold ${16 * scaleX}px sans-serif`;
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.fillText(title, relX + (80 * scaleX), relY + (16 * scaleY));

            ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
            ctx.font = `${13 * scaleX}px sans-serif`;
            ctx.fillText(artist, relX + (80 * scaleX), relY + (40 * scaleY));
          } else {
            // Pill / Compact
            var pillW = 280 * scaleX;
            var pillH = 46 * scaleY;
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.roundRect(relX, relY, pillW, pillH, 23 * scaleX);
            ctx.fill();

            // Circle Cover
            ctx.drawImage(coverToDraw, relX + (6 * scaleX), relY + (5 * scaleY), 36 * scaleX, 36 * scaleY);

            ctx.fillStyle = "#000000";
            ctx.font = `bold ${14 * scaleX}px sans-serif`;
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(title + " • " + artist, relX + (50 * scaleX), relY + (23 * scaleY));
          }
          checkFinished();
        };

        coverToDraw.onerror = function() {
          checkFinished();
        };
      } else {
        checkFinished();
      }
    });
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
      music_cover: selectedStoryMusicCover || null,
      music_start_time: selectedMusicStartTime || 0,
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

// 📱 სთორის ქვედა პარამეტრების მენიუს გახსნა
function openStoryActionSheet(event) {
  if (event) event.stopPropagation();
  pauseStoryTimer();

  var sheetModal = document.getElementById('story-options-modal');
  var sheetContent = document.getElementById('story-sheet-content');
  if (!sheetModal || !sheetContent) return;

  var currentStory = activeUserStoryGroup[activeStoryIndex];
  if (!currentStory) return;

  var myUid = (typeof currentUser !== 'undefined' && currentUser) ? currentUser.uid : (firebase.auth().currentUser ? firebase.auth().currentUser.uid : null);
  var isMyStory = myUid && (currentStory.user_id === myUid);

  var html = '';

  if (isMyStory) {
    html += `
      <div class="story-sheet-action-row delete-action" onclick="showStoryDeleteConfirm()">
        <div class="story-sheet-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </div>
        <span>სთორის წაშლა</span>
      </div>
    `;
  } else {
    html += `
      <div class="story-sheet-action-row" onclick="copyStoryLink()">
        <div class="story-sheet-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
        </div>
        <span>ბმულის კოპირება</span>
      </div>
      <div class="story-sheet-action-row delete-action" onclick="reportCurrentStory()">
        <div class="story-sheet-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <span>დარეპორტება</span>
      </div>
    `;
  }

  sheetContent.innerHTML = html;
  sheetModal.style.display = 'flex';
}

function closeStoryActionSheet() {
  var sheetModal = document.getElementById('story-options-modal');
  if (sheetModal) sheetModal.style.display = 'none';
  resumeStoryTimer();
}

function showStoryDeleteConfirm() {
  var sheetModal = document.getElementById('story-options-modal');
  if (sheetModal) sheetModal.style.display = 'none';

  var confirmModal = document.getElementById('story-delete-confirm-modal');
  if (confirmModal) confirmModal.style.display = 'flex';
}

function closeStoryDeleteConfirm() {
  var confirmModal = document.getElementById('story-delete-confirm-modal');
  if (confirmModal) confirmModal.style.display = 'none';
  resumeStoryTimer();
}

function confirmDeleteActiveStory() {
  var currentStory = activeUserStoryGroup[activeStoryIndex];
  if (!currentStory || !currentStory.id) return;

  var confirmModal = document.getElementById('story-delete-confirm-modal');

  db.collection('stories').doc(currentStory.id).delete().then(function() {
    if (confirmModal) confirmModal.style.display = 'none';

    activeUserStoryGroup.splice(activeStoryIndex, 1);

    if (activeUserStoryGroup.length > 0) {
      if (activeStoryIndex >= activeUserStoryGroup.length) {
        activeStoryIndex = activeUserStoryGroup.length - 1;
      }
      renderProgressBarsUI();
      var uName = document.getElementById('sv-username').innerText;
      var avImg = document.querySelector('#sv-avatar img');
      var avUrl = avImg ? avImg.src : null;
      displayActiveStoryItem(uName, avUrl);
    } else {
      closeStoryViewer();
    }

    if (typeof loadStories === 'function') {
      loadStories();
    } else {
      location.reload();
    }
  }).catch(function(err) {
    console.error("Story delete error:", err);
    alert("წაშლისას მოხდა შეცდომა: " + err.message);
    closeStoryDeleteConfirm();
  });
}

function copyStoryLink() {
  closeStoryActionSheet();
  navigator.clipboard.writeText(window.location.href);
  alert("ბმული დაკოპირდა!");
}

function reportCurrentStory() {
  closeStoryActionSheet();
  alert("მადლობა, შეტყობინება მიღებულია ადმინისტრაციის მიერ.");
}
