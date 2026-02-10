import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';

export default function Chatbot() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! I'm your hospital assistant. How can I help you today?", sender: 'bot' }
    ]);
    const [inputText, setInputText] = useState("");
    const messagesEndRef = useRef(null);

    const faqs = [
        { q: "How do I book an appointment?", a: "To book an appointment, go to the 'Appointments' tab and click the '+ Book New' button. Select a doctor and a time." },
        { q: "Where can I view my bills?", a: "You can view your past and pending invoices in the 'Invoices & Bills' tab on your dashboard." },
        { q: "How do I see my prescriptions?", a: "Your doctor's prescriptions are listed under the 'Prescribed Medicines' tab." },
        { q: "What are the hospital hours?", a: "Our emergency department is open 24/7. Outpatient (OPD) services are available from 9:00 AM to 5:00 PM, Monday to Saturday." },
        { q: "Who do I contact for emergencies?", a: "For medical emergencies, please call our emergency hotline at 108 or our direct line +91-123-456-7890 immediately." }
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = () => {
        if (!inputText.trim()) return;

        const newMsg = { id: Date.now(), text: inputText, sender: 'user' };
        setMessages(prev => [...prev, newMsg]);
        setInputText("");

        // Simple mock response for non-FAQ input
        setTimeout(() => {
            const botMsg = {
                id: Date.now() + 1,
                text: "I'm currently a simple FAQ bot. Please select one of the frequently asked questions below, or contact support for more complex queries.",
                sender: 'bot'
            };
            setMessages(prev => [...prev, botMsg]);
        }, 1000);
    };

    const handleFAQClick = (faq) => {
        const userMsg = { id: Date.now(), text: faq.q, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);

        setTimeout(() => {
            const botMsg = { id: Date.now() + 1, text: faq.a, sender: 'bot' };
            setMessages(prev => [...prev, botMsg]);
        }, 500);
    };

    return (
        <>
            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95"
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-8rem)] glass-card bg-white dark:bg-slate-900 flex flex-col rounded-2xl shadow-2xl z-40 animate-in slide-in-from-bottom-10 fade-in duration-300 border border-gray-200 dark:border-slate-700">

                    {/* Header */}
                    <div className="p-4 bg-blue-600 rounded-t-2xl flex items-center gap-3 shadow-md">
                        <div className="p-2 bg-white/20 rounded-full">
                            <Bot size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Hospital Assistant</h3>
                            <p className="text-blue-100 text-xs flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                Online
                            </p>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl ${msg.sender === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-tl-none shadow-sm'
                                    }`}>
                                    <p className="text-sm">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* FAQ Suggestions */}
                    <div className="p-2 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5 overflow-x-auto whitespace-nowrap scrollbar-hide">
                        <div className="flex gap-2 px-2">
                            {faqs.map((faq, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleFAQClick(faq)}
                                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm"
                                >
                                    {faq.q}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-gray-100 dark:border-white/10 bg-white/50 dark:bg-black/10 backdrop-blur-sm rounded-b-2xl">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type a message..."
                                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white placeholder-gray-400"
                            />
                            <button
                                onClick={handleSend}
                                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!inputText.trim()}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
