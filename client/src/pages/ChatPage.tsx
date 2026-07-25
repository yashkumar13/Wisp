import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import type { Socket } from 'socket.io-client'

type ChatPageProps = {
  username: string
  userId: string | null
  onLogout: () => void
  socket: Socket | null
}

type User = {
  _id: string
  username: string
  email: string
}

type Conversation = {
  conversationId: string
  partnerId: string
  lastMessagePreview: string
  lastMessageAt: string
  unreadCount: number
}

type Message = {
  _id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
}

const initialConversation: Conversation[] = []

export function ChatPage({ username, userId, onLogout, socket }: ChatPageProps) {
  const [contacts, setContacts] = useState<User[]>([])
  const [conversations, setConversations] = useState<Conversation[]>(initialConversation)
  const [selectedContact, setSelectedContact] = useState<User | null>(null)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')

  const currentContactId = selectedContact?._id

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, convoRes] = await Promise.all([
          axios.get('http://localhost:3000/api/user'),
          axios.get('http://localhost:3000/api/chat/conversations'),
        ])

        const users: User[] = usersRes.data
        setContacts(users.filter((user) => user._id !== userId))
        setConversations(convoRes.data)
      } catch (error) {
        console.error('Unable to load chat data', error)
      }
    }

    fetchData()
  }, [userId])

  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (event: any) => {
      if (event.conversationId === selectedConversationId) {
        setMessages((cur) => [...cur, event.message])
      }

      setConversations((current) => {
        const existing = current.find((c) => c.conversationId === event.conversationId)
        if (existing) {
          return current.map((conversation) =>
            conversation.conversationId === event.conversationId
              ? {
                  ...conversation,
                  lastMessagePreview: event.message.content,
                  lastMessageAt: new Date().toISOString(),
                  unreadCount:
                    conversation.partnerId === event.senderId
                      ? conversation.unreadCount + 1
                      : conversation.unreadCount,
                }
              : conversation,
          )
        }

        return current
      })
    }

    socket.on('message:new', handleNewMessage)

    return () => {
      socket.off('message:new', handleNewMessage)
    }
  }, [socket, selectedConversationId])

  const selectContact = async (contact: User) => {
    setSelectedContact(contact)

    const existingConversation = conversations.find((conversation) => conversation.partnerId === contact._id)
    if (existingConversation) {
      setSelectedConversationId(existingConversation.conversationId)
      const messagesRes = await axios.get(`http://localhost:3000/api/chat/conversations/${existingConversation.conversationId}/messages`)
      setMessages(messagesRes.data)
      return
    }

    setSelectedConversationId(null)
    setMessages([])
  }

  const sendMessage = async () => {
    if (!socket || !newMessage.trim() || !selectedContact) return

    const payload: any = {
      content: newMessage.trim(),
    }

    if (selectedConversationId) {
      payload.conversationId = selectedConversationId
    } else {
      payload.recipientId = selectedContact._id
    }

    socket.emit('message:send', payload, (response: any) => {
      if (response?.message) {
        setMessages((cur) => [...cur, response.message])
        if (!selectedConversationId && response.conversationId) {
          setSelectedConversationId(response.conversationId)
          setConversations((cur) => [
            {
              conversationId: response.conversationId,
              partnerId: selectedContact._id,
              lastMessagePreview: response.message.content,
              lastMessageAt: response.message.createdAt,
              unreadCount: 0,
            },
            ...cur,
          ])
        }
      }
    })

    setNewMessage('')
  }

  const currentContact = useMemo(
    () => contacts.find((contact) => contact._id === currentContactId) || selectedContact,
    [contacts, currentContactId, selectedContact],
  )

  return (
    <div className="chat-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div>
            <p className="eyebrow">Pulse workspace</p>
            <h2>Chats</h2>
          </div>
          <button type="button" className="ghost-button" onClick={onLogout}>
            Logout
          </button>
        </div>

        <div className="profile-pill">
          <span className="avatar">{username.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{username}</strong>
            <small>   Online now</small>
          </div>
        </div>

        <div className="contact-list">
          {contacts.map((contact) => (
            <button
              key={contact._id}
              type="button"
              className={`contact-item ${selectedContact?._id === contact._id ? 'active' : ''}`}
              onClick={() => selectContact(contact)}
            >
              <span className="dot" />
              {contact.username}
            </button>
          ))}
        </div>
      </aside>

      <main className="chat-pane">
        <div className="chat-header">
          <div>
            <p className="eyebrow">Active thread</p>
            <h2>{currentContact?.username ?? 'Select a contact'}</h2>
          </div>
          <span className="status-pill">{socket?.connected ? 'Connected' : 'Disconnected'}</span>
        </div>

        <section className="message-list">
          {messages.map((message) => (
            <div
              key={message._id}
              className={`message-row ${message.senderId === currentContact?._id ? 'incoming' : 'outgoing'}`}
            >
              <div className="message-bubble">
                <p>{message.content}</p>
              </div>
            </div>
          ))}
        </section>

        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault()
            sendMessage()
          }}
        >
          <input
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            placeholder={selectedContact ? `Message ${selectedContact.username}...` : 'Select a contact first'}
            disabled={!selectedContact}
          />
          <button type="submit" className="primary-button" disabled={!selectedContact || !newMessage.trim()}>
            Send
          </button>
        </form>
      </main>
    </div>
  )
}
