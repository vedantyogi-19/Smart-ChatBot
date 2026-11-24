import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

export type LanguageCode = 'en' | 'mr';

export interface ModuleConfig {
  name: string;
  icon: string;
  path: string;
  description: string;
  suggestions: string[];
  isLoaded: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Translation {
  title: string;
  subtitle: string;
  tagline: string;
  selectModule: string;
  hfTokenLabel: string;
  hfTokenPlaceholder: string;
  save: string;
  savedMsg: string;
  clearedMsg: string;
  govtDept: string;
  smartMission: string;
  ready: string;
  missing: string;
  systemReady: string;
  docMissing: string;
  welcomeTitle: string;
  welcomeSub: string;
  openModule: string;
  readyToAssist: string;
  askAnything: string;
  placeholder: string;
  listeningPlaceholder: string;
  quickQueries: string;
  disclaimer: string;
  processing: string;
  assistantSender: string;
  copy: string;
  copied: string;
  edit: string;
  deleteMsg: string;
  saveEdit: string;
  cancelEdit: string;
  listening: string;
  speak: string;
  voice: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  apiKey = '';
  apiConfigured = false;
  modules: ModuleConfig[] = [];
  activeModule: ModuleConfig | null = null;
  chatHistories: { [moduleName: string]: ChatMessage[] } = {};
  userMessage = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  isVoiceMode = false;
  isListening = false;
  recognition: any;
  currentAudio: HTMLAudioElement | null = null;
  typingInterval: any = null;

  // Language state
  currentLang: LanguageCode = 'en';

  // Bolt Layout States
  sidebarOpen = true;
  editingIndex: number | null = null;
  editDraft = '';
  copiedStatus: { [key: number]: boolean } = {};

  translations: Record<LanguageCode, Translation> = {
    en: {
      title: 'SMART MIS Assistant',
      subtitle: 'USER MANUAL CHATBOT',
      tagline: 'Official User Manual Chatbot. Ask queries about the SMART Maharashtra MIS platform.',
      selectModule: 'Select Manual Module',
      hfTokenLabel: 'API Configuration',
      hfTokenPlaceholder: 'API Key...',
      save: 'Save',
      savedMsg: 'Configured successfully!',
      clearedMsg: 'Config cleared.',
      govtDept: 'Dept. of Agriculture, Govt. of Maharashtra',
      smartMission: 'Smart Maharashtra Mission · 2025',
      ready: 'Ready',
      missing: 'Missing',
      systemReady: 'System Ready',
      docMissing: 'Document Missing',
      welcomeTitle: 'SMART MIS User Manual Assistant',
      welcomeSub: 'Welcome to the official AI-powered User Manual Chatbot for the SMART Maharashtra Integrated MIS Platform. Select a module below to get started.',
      openModule: 'Open Module',
      readyToAssist: 'Ready to assist',
      askAnything: 'Ask me anything about the manual, or click a suggestion below.',
      placeholder: 'Type your question about the manual...',
      listeningPlaceholder: '🎙 Listening... Speak your question now',
      quickQueries: 'Quick queries:',
      disclaimer: 'This AI assistant may make errors. Always verify critical information against the official SMART MIS user manual.',
      processing: 'Processing your query...',
      assistantSender: 'SMART MIS Assistant',
      copy: 'Copy',
      copied: 'Copied',
      edit: 'Edit',
      deleteMsg: 'Delete',
      saveEdit: 'Save',
      cancelEdit: 'Cancel',
      listening: 'Listening...',
      speak: 'Speak',
      voice: 'Voice'
    },
    mr: {
      title: 'स्मार्ट एमआयएस सहाय्यक',
      subtitle: 'वापरकर्ता मॅन्युअल चॅटबॉट',
      tagline: 'अधिकृत वापरकर्ता मॅन्युअल चॅटबॉट. स्मार्ट महाराष्ट्र एमआयएस प्लॅटफॉर्मबद्दल प्रश्न विचारा.',
      selectModule: 'मॅन्युअल मॉड्यूल निवडा',
      hfTokenLabel: 'एपीआय संरचना',
      hfTokenPlaceholder: 'एपीआय टोकन टाका...',
      save: 'जतन करा',
      savedMsg: 'यशस्वीरित्या जतन केले!',
      clearedMsg: 'हटावले.',
      govtDept: 'कृषी विभाग, महाराष्ट्र शासन',
      smartMission: 'स्मार्ट महाराष्ट्र मिशन · २०२५',
      ready: 'सज्ज',
      missing: 'अनुपलब्ध',
      systemReady: 'प्रणाली सज्ज',
      docMissing: 'दस्तऐवज अनुपलब्ध',
      welcomeTitle: 'स्मार्ट एमआयएस वापरकर्ता मॅन्युअल सहाय्यक',
      welcomeSub: 'स्मार्ट महाराष्ट्र एकात्मिक एमआयएस प्लॅटफॉर्मच्या अधिकृत एआय-आधारित चॅटबॉटमध्ये आपले स्वागत आहे. प्रारंभ करण्यासाठी खालील मॉड्यूल निवडा.',
      openModule: 'मॉड्यूल उघडा',
      readyToAssist: 'मदत करण्यास सज्ज',
      askAnything: 'मॅन्युअल बद्दल काहीही विचारा किंवा खालील सूचनेवर क्लिक करा.',
      placeholder: 'मॅन्युअल बद्दल आपला प्रश्न टाइप करा...',
      listeningPlaceholder: '🎙 ऐकत आहे... आता बोला',
      quickQueries: 'जलद प्रश्न:',
      disclaimer: 'हे एआय सहाय्यक चुका करू शकते. नेहमी अधिकृत मॅन्युअल तपासा.',
      processing: 'आपल्या प्रश्नावर प्रक्रिया करत आहे...',
      assistantSender: 'स्मार्ट एमआयएस सहाय्यक',
      copy: 'कॉपी करा',
      copied: 'कॉपी केले',
      edit: 'संपादित करा',
      deleteMsg: 'हटवा',
      saveEdit: 'जतन करा',
      cancelEdit: 'रद्द करा',
      listening: 'ऐकत आहे...',
      speak: 'बोला',
      voice: 'आवाज'
    }
  };

  get t(): Translation {
    return this.translations[this.currentLang];
  }

  constructor(private http: HttpClient) {}

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (window.innerWidth < 1024) {
      this.sidebarOpen = false;
    } else {
      this.sidebarOpen = true;
    }
  }

  ngOnInit() {
    const savedApiKey = localStorage.getItem('HF_TOKEN') || localStorage.getItem('GEMINI_API_KEY');
    if (savedApiKey) {
      this.apiKey = savedApiKey;
      this.apiConfigured = true;
    }

    const savedLang = localStorage.getItem('app_language') as LanguageCode;
    if (savedLang && (savedLang === 'en' || savedLang === 'mr')) {
      this.currentLang = savedLang;
    } else {
      this.currentLang = 'en';
    }

    if (window.innerWidth < 1024) {
      this.sidebarOpen = false;
    }

    this.loadModules();
    this.initSpeechRecognition();
  }

  setLanguage(lang: LanguageCode) {
    this.currentLang = lang;
    localStorage.setItem('app_language', lang);
    this.updateSpeechLang();
  }

  updateSpeechLang() {
    if (this.recognition) {
      this.recognition.lang = this.currentLang === 'mr' ? 'mr-IN' : 'en-IN';
    }
  }

  loadModules() {
    this.http.get<ModuleConfig[]>(`${environment.apiUrl}/Modules`).subscribe({
      next: (data) => {
        this.modules = data;
      },
      error: (err) => {
        console.error('Failed to load modules', err);
        this.errorMessage = 'Could not load modules from backend. Make sure backend is running.';
      }
    });
  }

  selectModule(module: ModuleConfig) {
    this.clearTypingEffect();
    this.activeModule = module;
    this.errorMessage = '';
    this.successMessage = '';
    if (!this.chatHistories[module.name]) {
      this.chatHistories[module.name] = [];
    }
    if (window.innerWidth < 1024) {
      this.sidebarOpen = false;
    }
  }

  clearTypingEffect() {
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
      this.typingInterval = null;
    }
  }

  saveApiKey() {
    if (this.apiKey.trim()) {
      localStorage.setItem('HF_TOKEN', this.apiKey.trim());
      this.apiConfigured = true;
      this.successMessage = this.t.savedMsg;
      this.errorMessage = '';
      setTimeout(() => this.successMessage = '', 3000);
    } else {
      localStorage.removeItem('HF_TOKEN');
      localStorage.removeItem('GEMINI_API_KEY');
      this.apiConfigured = false;
      this.errorMessage = this.t.clearedMsg;
      setTimeout(() => this.errorMessage = '', 3000);
    }
  }

  sendChatMessage(messageText?: string) {
    const textToSend = messageText || this.userMessage;
    if (!textToSend.trim() || !this.activeModule) return;

    this.clearTypingEffect();

    if (!messageText) {
      this.userMessage = '';
      this.resetTextareaHeight();
    }

    const currentModule = this.activeModule.name;

    // Add user message to UI immediately
    const userMsgObj: ChatMessage = { role: 'user', content: textToSend };
    this.chatHistories[currentModule].push(userMsgObj);

    this.isLoading = true;
    this.errorMessage = '';

    // Build chat payload
    const payload = {
      apiKey: this.apiKey,
      moduleName: currentModule,
      userMessage: textToSend,
      history: this.chatHistories[currentModule].slice(0, -1),
      voiceToVoice: this.isVoiceMode,
      language: this.currentLang
    };

    this.http.post<{ reply: string, audioBase64?: string }>(`${environment.apiUrl}/Modules/chat`, payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        // ChatGPT-style word-by-word streaming effect
        this.streamAssistantReply(currentModule, response.reply, response.audioBase64);
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.errorMessage = err.error || 'Failed to get response from assistant.';
        this.chatHistories[currentModule].pop();
      }
    });
  }

  // ChatGPT-Style Word-by-Word Streaming Typewriter Effect
  streamAssistantReply(moduleName: string, fullReply: string, audioBase64?: string) {
    const assistantMsgObj: ChatMessage = { role: 'assistant', content: '' };
    this.chatHistories[moduleName].push(assistantMsgObj);
    const msgIndex = this.chatHistories[moduleName].length - 1;

    // Tokenize text into words / spaces for smooth streaming
    const tokens = fullReply.split(/(\s+)/);
    let tokenIndex = 0;

    this.typingInterval = setInterval(() => {
      if (tokenIndex < tokens.length) {
        this.chatHistories[moduleName][msgIndex].content += tokens[tokenIndex];
        tokenIndex++;
        this.scrollToBottom();
      } else {
        this.clearTypingEffect();
        this.scrollToBottom();
        if (this.isVoiceMode && audioBase64) {
          this.playAudio(audioBase64);
        }
      }
    }, 16); // ~60fps fast professional streaming speed
  }

  useSuggestion(suggestion: string) {
    this.sendChatMessage(suggestion);
  }

  scrollToBottom() {
    setTimeout(() => {
      const scrollContainer = document.querySelector('.messages-scroll');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }, 50);
  }

  formatMessageContent(content: string): string {
    let html = content;
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    html = html.replaceAll('\n', '<br>');
    return html;
  }

  initSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.updateSpeechLang();
      this.recognition.interimResults = false;

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };

      this.recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          this.userMessage = text;
          this.sendChatMessage();
        }
      };

      this.recognition.onerror = (err: any) => {
        console.error('Speech recognition error', err);
        this.isListening = false;
      };
    }
  }

  toggleVoiceMode() {
    this.isVoiceMode = !this.isVoiceMode;
    if (!this.isVoiceMode && this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }

  handleVoiceButton() {
    if (!this.recognition) {
      this.errorMessage = 'Speech Recognition is not supported by your browser.';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    this.updateSpeechLang();
    if (!this.isVoiceMode) {
      this.isVoiceMode = true;
      this.recognition.start();
    } else if (this.isListening) {
      this.recognition.stop();
    } else {
      this.recognition.start();
    }
  }

  playAudio(base64Data: string) {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
    const audioUrl = `data:audio/mp3;base64,${base64Data}`;
    this.currentAudio = new Audio(audioUrl);
    this.currentAudio.play().catch(e => console.error('Audio playback error', e));
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  copyMessage(index: number, content: string) {
    navigator.clipboard.writeText(content);
    this.copiedStatus[index] = true;
    setTimeout(() => {
      this.copiedStatus[index] = false;
    }, 2000);
  }

  startEdit(index: number, currentContent: string) {
    this.editingIndex = index;
    this.editDraft = currentContent;
  }

  saveEdit(index: number) {
    if (this.editDraft.trim() && this.activeModule) {
      const moduleName = this.activeModule.name;
      this.chatHistories[moduleName][index].content = this.editDraft;
      const historyUntilEdit = this.chatHistories[moduleName].slice(0, index);
      const editedUserText = this.editDraft;
      this.chatHistories[moduleName] = historyUntilEdit;
      this.editingIndex = null;
      this.sendChatMessage(editedUserText);
    }
  }

  cancelEdit() {
    this.editingIndex = null;
    this.editDraft = '';
  }

  deleteMessage(index: number) {
    if (this.activeModule) {
      const moduleName = this.activeModule.name;
      this.chatHistories[moduleName].splice(index, 1);
    }
  }

  adjustTextareaHeight(event: any) {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }

  resetTextareaHeight() {
    const textarea = document.querySelector('.chat-input-textarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto';
    }
  }

  onKeydownEnter(event: any) {
    if (!event.shiftKey) {
      event.preventDefault();
      this.sendChatMessage();
    }
  }
}
