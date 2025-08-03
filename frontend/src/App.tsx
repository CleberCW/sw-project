import React, { useState, useRef } from "react";
import "./App.css";
import { FaPaperPlane, FaImage } from "react-icons/fa";

type Message = {
  text: string;
  sender: "user" | "bot";
  image?: string;
};

const API_BASE = "http://localhost:8000"; // ajuste se necessário

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Olá! Sou seu assistente de estilo. Como posso ajudar?",
      sender: "bot",
    },
  ]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendMessage = async () => {
    if (!input && !image) return;
    const userMsg: Message = { text: input, sender: "user" };
    setMessages((msgs) => [...msgs, userMsg]);

    if (image) {
      // Envia imagem para backend
      const formData = new FormData();
      formData.append("image", image);
      formData.append("description", input);
      const res = await fetch(`${API_BASE}/wardrobe/add`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      let msg = "Peça cadastrada!";
      let imgUrl = "";
      if (data.piece && data.piece.description) {
        msg = `Peça cadastrada: ${data.piece.description}`;
        // Cria URL local da imagem enviada
        if (image) {
          imgUrl = URL.createObjectURL(image);
        }
      }
      setMessages((msgs) => [
        ...msgs,
        { text: msg, sender: "bot", image: imgUrl },
      ]);
      setImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      // Envia texto para backend (sugestão de look)
      const res = await fetch(`${API_BASE}/suggest/look`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `event=${encodeURIComponent(input)}&location=SP`,
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (res.status === 400) {
        setMessages((msgs) => [
          ...msgs,
          {
            text:
              data.error ||
              "Nenhuma peça cadastrada. Por favor, envie uma foto para cadastrar sua primeira peça.",
            sender: "bot",
          },
        ]);
      } else if (data.suggestion) {
        // Se o backend retornar imagens das peças sugeridas, exibe junto
        setMessages((msgs) => [
          ...msgs,
          {
            text: data.suggestion,
            sender: "bot",
            image:
              Array.isArray(data.images) && data.images.length > 0
                ? data.images[0]
                : undefined,
          },
        ]);
        // Se houver mais de uma imagem, adiciona mensagens extras para cada peça
        if (Array.isArray(data.images) && data.images.length > 1) {
          for (let i = 1; i < data.images.length; i++) {
            setMessages((msgs) => [
              ...msgs,
              {
                text: "Peça sugerida:",
                sender: "bot",
                image: data.images[i],
              },
            ]);
          }
        }
      } else {
        setMessages((msgs) => [
          ...msgs,
          {
            text: "Não entendi, tente novamente.",
            sender: "bot",
          },
        ]);
      }
    }
    setInput("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  return (
    <div className="whatsapp-bg">
      <div className="chat-header">
        <img src="./Logo.png" alt="avatar" className="avatar" />
        <span className="chat-title">Vest.Ai</span>
      </div>
      <div className="chat-body">
        {messages.map((msg, idx) => (
          <div key={idx} className={`bubble ${msg.sender}`}>
            {msg.image && (
              <img src={msg.image} alt="enviada" className="bubble-img" />
            )}
            <span>{msg.text}</span>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          placeholder="Digite uma mensagem..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <label htmlFor="file-upload" className="icon-btn">
          <FaImage size={22} />
        </label>
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          style={{ display: "none" }}
        />
        <button className="icon-btn send-btn" onClick={sendMessage}>
          <FaPaperPlane size={22} />
        </button>
      </div>
    </div>
  );
}

export default App;
