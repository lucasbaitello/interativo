import { useState, useEffect } from 'react';

export default function EnvironmentSelector({ currentEnvironment, onEnvironmentChange }) {
    const [environments, setEnvironments] = useState([]);

    useEffect(() => {
        fetch('/environments.json')
            .then(res => res.json())
            .then(data => setEnvironments(data))
            .catch(err => console.error('Erro ao carregar ambientes:', err));
    }, []);

    return (
        <div className="fixed bottom-0 left-0 w-full h-24 z-40 flex items-end justify-center pb-6 pointer-events-none group">
            {/* Área de ativação invisível na parte inferior */}
            <div className="absolute bottom-0 w-full h-20 pointer-events-auto" />

            {/* Carrossel */}
            <div className="pointer-events-auto flex gap-3 p-2 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-8 group-hover:translate-y-0 max-w-[90vw] overflow-x-auto scroll-thin custom-scrollbar">
                {environments.map(env => (
                    <button
                        key={env.id}
                        onClick={() => onEnvironmentChange(env.id)}
                        className={`relative w-32 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 group/item ${env.id === currentEnvironment
                                ? 'border-white shadow-lg scale-105 z-10 opacity-100'
                                : 'border-transparent opacity-50 hover:opacity-100 hover:scale-105 hover:border-white/50'
                            }`}
                    >
                        {env.thumbnail ? (
                            <img src={env.thumbnail} alt={env.name} className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110" />
                        ) : (
                            <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-xs text-white/50">Sem imagem</div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

                        <div className="absolute bottom-0 left-0 w-full p-1.5 text-center">
                            <div className="text-[10px] font-medium text-white text-shadow truncate leading-tight">{env.name}</div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
