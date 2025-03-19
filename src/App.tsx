import { LandingContent } from './LandingContent';
import { ChatInput } from './ChatInput';
import styles from './App.module.css';
import { useIsMobileLayout } from './theme/useIsMobileLayout';
import { MobileSideBar } from './MobileSideBar';
import { useMemo, useState, useCallback } from 'react';
import hardDiamondLogo from './assets/hardDiamondLogo.svg';
import { DesktopSideBar } from './DesktopSideBar';
import { NavBar } from './NavBar';
import { ChatMessage, ConversationHistories } from './types';
import { mockConversationHistories } from './mocks/conversationHistory';
import { ChatHistory } from './ChatHistory';
import { Conversation } from './Conversation';

export const App = () => {
  const [isMobileSideBarOpen, setIsMobileSideBarOpen] = useState(false);
  const [isDesktopSideBarOpen, setIsDesktopSideBarOpen] = useState(true);

  const [conversationHistories, setConversationHistories] =
    useState<ConversationHistories>(mockConversationHistories);

  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  const activeConversationMessages = useMemo(() => {
    if (!activeConversationId) return [];

    const activeConversation = conversationHistories[activeConversationId];
    if (!activeConversation) return [];

    return activeConversation.conversation;
  }, [activeConversationId, conversationHistories]);

  const handleSubmitMessage = useCallback(
    (message: ChatMessage) => {
      //  if this is the first message in the conversation, assign it an ID
      if (!activeConversationId) {
        const newConversationId = `conv-${new Date().toISOString()}`;
        setActiveConversationId(newConversationId);

        const systemPrompt: ChatMessage = {
          role: 'system',
          content: 'You are a helpful AI assistant.',
        };

        //  then add it to the conversation
        setConversationHistories((prev) => ({
          ...prev,
          [newConversationId]: {
            id: newConversationId,
            model: 'gpt-4o',
            title: 'New Chat',
            conversation: [systemPrompt, message],
            lastSaved: Date.now(),
            tokensRemaining: 8000,
          },
        }));
      } else {
        //  Update existing conversation
        setConversationHistories((prev) => {
          const currentConversation = prev[activeConversationId];

          return {
            ...prev,
            [activeConversationId]: {
              ...currentConversation,
              conversation: [...currentConversation.conversation, message],
              lastSaved: Date.now(),
            },
          };
        });
      }
    },
    [activeConversationId],
  );

  const handleDeleteConversation = useCallback(
    (id: string) => {
      setConversationHistories((prev) => {
        const newConversations = { ...prev };
        delete newConversations[id];
        return newConversations;
      });

      //  If the deleted conversation was active, clear the active conversation
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    },
    [activeConversationId],
  );

  const handleUpdateConversationTitle = useCallback(
    (id: string, newTitle: string) => {
      setConversationHistories((prev) => {
        const updatedConversation = prev[id];
        if (!updatedConversation) return prev;

        return {
          ...prev,
          [id]: {
            ...updatedConversation,
            title: newTitle,
          },
        };
      });
    },
    [],
  );

  const isMobileLayout = useIsMobileLayout();
  const showMobileSideBar = isMobileLayout && isMobileSideBarOpen;
  const showDesktopSideBar = !isMobileLayout && isDesktopSideBarOpen;
  const sideBarStyles = `${styles.sidebar} ${isMobileSideBarOpen ? styles.isOpen : ''} ${isDesktopSideBarOpen ? '' : styles.isHidden}`;

  return (
    <div className={styles.app}>
      <div className={sideBarStyles}>
        <div className={styles.sidebarHeader}>
          <img src={hardDiamondLogo} alt="Hard Diamond logo" height={40} />
          <div className={styles.buttonGroup}>
            {showMobileSideBar && (
              <MobileSideBar
                onCloseClick={() => setIsMobileSideBarOpen(false)}
              />
            )}
            {showDesktopSideBar && (
              <DesktopSideBar
                onCloseClick={() => setIsDesktopSideBarOpen(false)}
              />
            )}
          </div>
        </div>

        <div className={styles.sidebarContent}>
          <ChatHistory
            chatHistories={conversationHistories}
            onSelectConversation={setActiveConversationId}
            activeConversationId={activeConversationId}
            onDeleteConversation={handleDeleteConversation}
            onUpdateConversationTitle={handleUpdateConversationTitle}
          />
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.chatview}>
          <div className={styles.scrollContainer}>
            <div className={styles.chatHeader}>
              <NavBar
                onMobileMenuClick={() => setIsMobileSideBarOpen(true)}
                onDesktopMenuClick={() => setIsDesktopSideBarOpen(true)}
                isDesktopSideBarOpen={isDesktopSideBarOpen}
              />
            </div>
            <div className={styles.chatContainer}>
              <div
                className={`${styles.chatContent} ${activeConversationId ? styles.fullHeight : ''}`}
              >
                {activeConversationId && (
                  <Conversation messages={activeConversationMessages} />
                )}
              </div>
              <div
                className={`${styles.controlsContainer} ${activeConversationId ? styles.positionSticky : ''}`}
              >
                {!activeConversationId && <LandingContent />}
                <ChatInput onSubmitMessage={handleSubmitMessage} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
