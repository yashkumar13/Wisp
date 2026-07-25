type ChatPageProps = {
  username: string
  onLogout: () => void
}

const conversation = [
  { sender: 'Ava', body: 'Morning! Are we ready to ship the next feature?', side: 'incoming' },
  { sender: 'You', body: 'Yes — I already drafted the onboarding flow.', side: 'outgoing' },
  { sender: 'Ava', body: 'Nice. Let’s align the chat layout before lunch.', side: 'incoming' },
  { sender: 'You', body: 'I’m on it. The UI is already looking much cleaner.', side: 'outgoing' },
]

const contacts = ['Ava', 'Noah', 'Sofia', 'Liam']

export function ChatPage({ username, onLogout }: ChatPageProps) {
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
            <small>Online now</small>
          </div>
        </div>

        <div className="contact-list">
          {contacts.map((contact) => (
            <button key={contact} type="button" className="contact-item">
              <span className="dot" />
              {contact}
            </button>
          ))}
        </div>
      </aside>

      <main className="chat-pane">
        <div className="chat-header">
          <div>
            <p className="eyebrow">Active thread</p>
            <h2>Ava • Product sync</h2>
          </div>
          <span className="status-pill">6 online</span>
        </div>

        <section className="message-list">
          {conversation.map((message) => (
            <div key={message.body} className={`message-row ${message.side}`}>
              <div className="message-bubble">
                <strong>{message.sender}</strong>
                <p>{message.body}</p>
              </div>
            </div>
          ))}
        </section>

        <form className="composer">
          <input placeholder="Write a message..." />
          <button type="button" className="primary-button">
            Send
          </button>
        </form>
      </main>
    </div>
  )
}
