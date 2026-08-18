import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors } from '../constants/colors';
import { FontFamily } from '../constants/typography';
import { UIQuestion } from '../data/adapter';
import { aiService, QuestionAIContext } from '../services/aiService';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: number;
  isOfflineFallback?: boolean;
}

interface AskAIChatModalProps {
  visible: boolean;
  question?: UIQuestion | null;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  '💡 Explain step 1',
  '⚡ What is the shortcut formula?',
  '🔍 Why is option B incorrect?',
  '⏱️ How to solve in <90s?',
  '🎯 What is the core theorem?',
];

/**
 * Renders text containing LaTeX math notations ($$...$$ and $...$) and basic markdown
 */
export function MathFormattedText({ content }: { content: string }) {
  // Split content by block LaTeX equations: $$...$$
  const blockRegex = /\$\$([\s\S]*?)\$\$/g;
  const parts: { type: 'text' | 'block_math'; value: string }[] = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        value: content.slice(lastIndex, match.index),
      });
    }
    parts.push({
      type: 'block_math',
      value: match[1].trim(),
    });
    lastIndex = blockRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      value: content.slice(lastIndex),
    });
  }

  return (
    <View style={styles.mathContainer}>
      {parts.map((part, pIdx) => {
        if (part.type === 'block_math') {
          return (
            <View key={pIdx} style={styles.blockMathCard}>
              <View style={styles.blockMathHeader}>
                <Text style={styles.formulaIcon}>📐</Text>
                <Text style={styles.formulaLabel}>FORMULA / EQUATION</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text style={styles.blockMathCode}>{part.value}</Text>
              </ScrollView>
            </View>
          );
        }

        // Parse lines within normal text
        const lines = part.value.split('\n');
        return (
          <View key={pIdx} style={styles.textSection}>
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) {
                return <View key={lIdx} style={{ height: 6 }} />;
              }

              // Heading 3
              if (trimmed.startsWith('### ')) {
                return (
                  <Text key={lIdx} style={styles.heading3}>
                    {trimmed.replace(/^###\s*/, '')}
                  </Text>
                );
              }

              // Bullet point or numbered step
              const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ');
              const isStep = /^\d+\.\s/.test(trimmed);

              // Inline math rendering helper within line
              const renderInlineSegments = (rawText: string) => {
                const inlineRegex = /\$([^\$]+)\$/g;
                const inlineParts: { isMath: boolean; text: string }[] = [];
                let inlineLast = 0;
                let iMatch: RegExpExecArray | null;

                while ((iMatch = inlineRegex.exec(rawText)) !== null) {
                  if (iMatch.index > inlineLast) {
                    inlineParts.push({ isMath: false, text: rawText.slice(inlineLast, iMatch.index) });
                  }
                  inlineParts.push({ isMath: true, text: iMatch[1].trim() });
                  inlineLast = inlineRegex.lastIndex;
                }

                if (inlineLast < rawText.length) {
                  inlineParts.push({ isMath: false, text: rawText.slice(inlineLast) });
                }

                return inlineParts.map((ip, ipIdx) => {
                  if (ip.isMath) {
                    return (
                      <Text key={ipIdx} style={styles.inlineMath}>
                        {' ' + ip.text + ' '}
                      </Text>
                    );
                  }

                  // Check bold tags **text**
                  const boldRegex = /\*\*([^\*]+)\*\*/g;
                  const boldSegments: { isBold: boolean; text: string }[] = [];
                  let bLast = 0;
                  let bMatch: RegExpExecArray | null;

                  while ((bMatch = boldRegex.exec(ip.text)) !== null) {
                    if (bMatch.index > bLast) {
                      boldSegments.push({ isBold: false, text: ip.text.slice(bLast, bMatch.index) });
                    }
                    boldSegments.push({ isBold: true, text: bMatch[1] });
                    bLast = boldRegex.lastIndex;
                  }
                  if (bLast < ip.text.length) {
                    boldSegments.push({ isBold: false, text: ip.text.slice(bLast) });
                  }

                  return boldSegments.map((bs, bsIdx) => (
                    <Text
                      key={`${ipIdx}-${bsIdx}`}
                      style={bs.isBold ? styles.boldText : styles.regularText}
                    >
                      {bs.text}
                    </Text>
                  ));
                });
              };

              if (isBullet || isStep) {
                const cleanLine = trimmed.replace(/^[-*•]\s*|^\d+\.\s*/, '');
                const prefix = isBullet ? '• ' : trimmed.match(/^\d+\.\s/)?.[0] || '1. ';
                return (
                  <View key={lIdx} style={styles.bulletRow}>
                    <Text style={styles.bulletPrefix}>{prefix}</Text>
                    <Text style={styles.bulletContent}>
                      {renderInlineSegments(cleanLine)}
                    </Text>
                  </View>
                );
              }

              return (
                <Text key={lIdx} style={styles.lineText}>
                  {renderInlineSegments(trimmed)}
                </Text>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

export function AskAIChatModal({
  visible,
  question,
  onClose,
}: AskAIChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isQuestionContextExpanded, setIsQuestionContextExpanded] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Initialize or reset chat conversation on question change or modal open
  useEffect(() => {
    if (visible && question) {
      const sectionName = question.section.toUpperCase();
      const initialGreeting: ChatMessage = {
        id: `greeting-${question.id}-${Date.now()}`,
        sender: 'coach',
        text: `### 🤖 Hello! I'm your AI Problem Coach
I'm ready to help you crack this **${sectionName}** CAT problem.

Tap a quick prompt below or type your question:`,
        timestamp: Date.now(),
      };
      setMessages([initialGreeting]);
      setInputText('');
      setIsGenerating(false);
      setIsQuestionContextExpanded(false);
    }
  }, [visible, question?.id]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isGenerating]);

  const handleSend = async (queryText: string) => {
    const cleanQuery = queryText.trim();
    if (!cleanQuery || !question || isGenerating) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: cleanQuery,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsGenerating(true);

    try {
      const fullStem = question.passage
        ? `${question.passage}\n\n${question.prompt}`
        : question.prompt;

      const formattedOptions = question.options?.map(
        (opt) => `${opt.key}: ${opt.text}`
      );

      const context: QuestionAIContext = {
        section: question.section,
        type: question.isTITA ? 'tita' : 'mcq',
        options: formattedOptions,
        correctAnswer: question.rawCorrectAnswer || question.correctKey,
        existingExplanation: question.explanation || undefined,
        hint: question.hint || undefined,
      };

      const response = await aiService.askAICoach(
        fullStem,
        cleanQuery,
        context
      );

      const coachMsg: ChatMessage = {
        id: `coach-${Date.now()}`,
        sender: 'coach',
        text: response.content,
        timestamp: response.timestamp,
        isOfflineFallback: response.isOfflineFallback,
      };

      setMessages((prev) => [...prev, coachMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `coach-err-${Date.now()}`,
        sender: 'coach',
        text: `⚠️ **Could not connect to AI Mentor.**\n\n${err?.message || 'Please check your connection or environment API key.'}`,
        timestamp: Date.now(),
        isOfflineFallback: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearChat = () => {
    if (!question) return;
    const initialGreeting: ChatMessage = {
      id: `greeting-${question.id}-${Date.now()}`,
      sender: 'coach',
      text: `### 🤖 Conversation Reset
Ask me any new questions about this **${question.section.toUpperCase()}** problem!`,
      timestamp: Date.now(),
    };
    setMessages([initialGreeting]);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}
        >
          <View style={styles.container}>
            {/* ─── Header ─────────────────────────────────────────── */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.coachAvatar}>
                  <Text style={{ fontSize: 20 }}>🤖</Text>
                </View>
                <View>
                  <View style={styles.titleBadgeRow}>
                    <Text style={styles.title}>AI Problem Coach</Text>
                    {question && (
                      <View style={[
                        styles.sectionBadge,
                        { backgroundColor: question.section === 'qa' ? Colors.qaBg : question.section === 'dilr' ? Colors.dilrBg : Colors.varcBg }
                      ]}>
                        <Text style={[
                          styles.sectionBadgeText,
                          { color: question.section === 'qa' ? Colors.qa : question.section === 'dilr' ? Colors.dilr : Colors.varc }
                        ]}>
                          {question.section.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.subtitle}>
                    Question {question?.id || ''} • Live Problem Coaching
                  </Text>
                </View>
              </View>

              <View style={styles.headerActions}>
                <Pressable
                  onPress={handleClearChat}
                  style={styles.headerIconBtn}
                  accessibilityLabel="Clear Chat"
                >
                  <Text style={styles.headerIconText}>🗑️</Text>
                </Pressable>
                <Pressable
                  onPress={onClose}
                  style={styles.closeBtn}
                  accessibilityLabel="Close Ask AI Modal"
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </Pressable>
              </View>
            </View>

            {/* ─── Question Context Preview ───────────────────────── */}
            {question && (
              <View style={styles.contextCard}>
                <Pressable
                  style={styles.contextHeader}
                  onPress={() => setIsQuestionContextExpanded((prev) => !prev)}
                >
                  <Text style={styles.contextTitle}>
                    📝 Question Context {isQuestionContextExpanded ? '▲' : '▼'}
                  </Text>
                  <Text style={styles.contextMeta}>
                    ID: {question.id} • {question.isTITA ? 'TITA' : 'MCQ'}
                  </Text>
                </Pressable>
                {isQuestionContextExpanded && (
                  <ScrollView style={styles.contextBody} nestedScrollEnabled>
                    {question.passage && (
                      <Text style={styles.contextPassage}>{question.passage}</Text>
                    )}
                    <Text style={styles.contextStem}>{question.prompt}</Text>
                    {question.options && question.options.length > 0 && (
                      <View style={styles.contextOptions}>
                        {question.options.map((opt) => (
                          <Text key={opt.key} style={styles.contextOptionText}>
                            {opt.key}. {opt.text}
                          </Text>
                        ))}
                      </View>
                    )}
                  </ScrollView>
                )}
              </View>
            )}

            {/* ─── Chat Transcript ────────────────────────────────── */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.transcript}
              contentContainerStyle={styles.transcriptContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageRow,
                      isUser ? styles.messageRowUser : styles.messageRowCoach,
                    ]}
                  >
                    {!isUser && (
                      <View style={styles.coachBubbleAvatar}>
                        <Text style={{ fontSize: 13 }}>🤖</Text>
                      </View>
                    )}
                    <View
                      style={[
                        styles.bubble,
                        isUser ? styles.bubbleUser : styles.bubbleCoach,
                      ]}
                    >
                      {isUser ? (
                        <Text style={styles.userBubbleText}>{msg.text}</Text>
                      ) : (
                        <MathFormattedText content={msg.text} />
                      )}

                      {msg.isOfflineFallback && !isUser && (
                        <View style={styles.fallbackBadge}>
                          <Text style={styles.fallbackBadgeText}>⚡ Offline Heuristic</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}

              {isGenerating && (
                <View style={[styles.messageRow, styles.messageRowCoach]}>
                  <View style={styles.coachBubbleAvatar}>
                    <Text style={{ fontSize: 13 }}>🤖</Text>
                  </View>
                  <View style={[styles.bubble, styles.bubbleCoach, styles.typingBubble]}>
                    <ActivityIndicator size="small" color={Colors.accentBlue} />
                    <Text style={styles.typingText}>AI Coach is thinking...</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* ─── Quick Prompt Suggestion Chips ─────────────────── */}
            <View style={styles.quickPromptsSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickPromptsScroll}
              >
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <Pressable
                    key={idx}
                    style={({ pressed }) => [
                      styles.promptChip,
                      pressed && styles.promptChipPressed,
                      isGenerating && styles.promptChipDisabled,
                    ]}
                    disabled={isGenerating}
                    onPress={() => handleSend(prompt)}
                  >
                    <Text style={styles.promptChipText}>{prompt}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* ─── Message Input Bar ──────────────────────────────── */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask AI Coach a question..."
                placeholderTextColor={Colors.placeholder}
                multiline={false}
                returnKeyType="send"
                onSubmitEditing={() => handleSend(inputText)}
                editable={!isGenerating}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.sendBtn,
                  (!inputText.trim() || isGenerating) && styles.sendBtnDisabled,
                  pressed && { opacity: 0.8 },
                ]}
                disabled={!inputText.trim() || isGenerating}
                onPress={() => handleSend(inputText)}
                accessibilityLabel="Send message to AI Coach"
              >
                <Text style={styles.sendBtnText}>➤</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 23, 0.75)',
    justifyContent: 'flex-end',
  },
  keyboardWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '88%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#F8FAFC',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  coachAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  sectionBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sectionBadgeText: {
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
  },
  subtitle: {
    fontSize: 11.5,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerIconText: {
    fontSize: 13,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  closeBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: Colors.textSecondary,
  },

  // Context card
  contextCard: {
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contextTitle: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  contextMeta: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },
  contextBody: {
    maxHeight: 110,
    marginTop: 6,
    paddingTop: 4,
  },
  contextPassage: {
    fontSize: 11.5,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  contextStem: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textBody,
    lineHeight: 17,
  },
  contextOptions: {
    marginTop: 4,
    gap: 2,
  },
  contextOptionText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },

  // Transcript
  transcript: {
    flex: 1,
    backgroundColor: '#FAFCFE',
  },
  transcriptContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowCoach: {
    justifyContent: 'flex-start',
  },
  coachBubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  bubble: {
    maxWidth: '84%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleCoach: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 1 },
      default: {},
    }),
  },
  userBubbleText: {
    fontSize: 13.5,
    fontFamily: FontFamily.medium,
    color: '#FFFFFF',
    lineHeight: 19,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  typingText: {
    fontSize: 12.5,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },
  fallbackBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 8,
  },
  fallbackBadgeText: {
    fontSize: 9.5,
    fontFamily: FontFamily.bold,
    color: '#B45309',
  },

  // Math & Markdown formatted container
  mathContainer: {
    gap: 4,
  },
  textSection: {
    gap: 3,
  },
  heading3: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
    marginTop: 4,
    marginBottom: 2,
  },
  lineText: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: Colors.textBody,
    lineHeight: 19,
  },
  regularText: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: Colors.textBody,
  },
  boldText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: Colors.textDark,
  },
  inlineMath: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 12.5,
    color: '#1E40AF',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
  },
  bulletPrefix: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: Colors.accentBlue,
    width: 18,
  },
  bulletContent: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: Colors.textBody,
    lineHeight: 19,
  },
  blockMathCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
  },
  blockMathHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  formulaIcon: {
    fontSize: 11,
  },
  formulaLabel: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  blockMathCode: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 13,
    fontFamilyBold: FontFamily.bold,
    color: '#0F172A',
    paddingVertical: 2,
  } as any,

  // Quick Prompts
  quickPromptsSection: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
  },
  quickPromptsScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  promptChip: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  promptChipPressed: {
    backgroundColor: '#E2E8F0',
  },
  promptChipDisabled: {
    opacity: 0.5,
  },
  promptChipText: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },

  // Input Bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13.5,
    fontFamily: FontFamily.regular,
    color: Colors.textBody,
    maxHeight: 80,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
});
