import React, { useState, useRef } from 'react';
import './App.css';

type Message = {
  text: string;
  sender: 'user' | 'bot';
  image?: string;
};

const API_BASE = 'http://localhost:8000'; // ajuste se necessário

function App() {
  const [messages, setMessages] = useState<Message[]>([
    { text: 'Olá! Sou seu assistente de estilo. Como posso ajudar?', sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendMessage = async () => {
    if (!input && !image) return;
    const userMsg: Message = { text: input, sender: 'user' };
    setMessages((msgs) => [...msgs, userMsg]);

    if (image) {
      // Envia imagem para backend
      const formData = new FormData();
      formData.append('image', image);
      formData.append('description', input);
      const res = await fetch(`${API_BASE}/wardrobe/add`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      let msg = 'Peça cadastrada!';
      if (data.piece && data.piece.description) {
        msg = `Peça cadastrada: ${data.piece.description}`;
      }
      setMessages((msgs) => [
        ...msgs,
        { text: msg, sender: 'bot' }
      ]);
      setImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      // Envia texto para backend (sugestão de look)
      const res = await fetch(`${API_BASE}/suggest/look`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `event=${encodeURIComponent(input)}&location=SP`,
      });
      const data = await res.json();
      setMessages((msgs) => [
        ...msgs,
        { text: data.suggestion || 'Não entendi, tente novamente.', sender: 'bot' }
      ]);
    }
    setInput('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  return (
    <div className="whatsapp-bg">
      <div className="chat-header">
        <img src="https://i.imgur.com/0y0y0y0.png" alt="avatar" className="avatar" />
        <span className="chat-title">Assistente de Estilo</span>
      </div>
      <div className="chat-body">
        {messages.map((msg, idx) => (
          <div key={idx} className={`bubble ${msg.sender}`}> 
            {msg.image && <img src={msg.image} alt="enviada" className="bubble-img" />}
            <span>{msg.text}</span>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          placeholder="Digite uma mensagem..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
        />
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} />
        <button onClick={sendMessage}>Enviar</button>
      </div>
    </div>
  );
}

export default App
