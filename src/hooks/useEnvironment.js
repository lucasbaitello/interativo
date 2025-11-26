import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Hook para gerenciar o ambiente atual e carregar suas configurações
 * 
 * Retorna:
 * - currentEnv: ID do ambiente atual
 * - envConfig: configuração do ambiente (imgPath, presetPath, etc)
 * - setCurrentEnv: função para mudar de ambiente
 * - environments: lista de todos os ambientes disponíveis
 */
export function useEnvironment() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [environments, setEnvironments] = useState([]);
    const [currentEnv, setCurrentEnv] = useState(null);

    // Carregar lista de ambientes
    useEffect(() => {
        fetch('/environments.json')
            .then(res => res.json())
            .then(data => {
                setEnvironments(data);

                // Determinar ambiente inicial
                const envFromUrl = searchParams.get('env');
                const defaultEnv = data[0]?.id || 'luzes';

                if (envFromUrl && data.some(e => e.id === envFromUrl)) {
                    setCurrentEnv(envFromUrl);
                } else {
                    setCurrentEnv(defaultEnv);
                }
            })
            .catch(err => {
                console.error('Erro ao carregar ambientes:', err);
                setCurrentEnv('luzes'); // fallback
            });
    }, [searchParams]);

    // Atualizar URL quando ambiente mudar
    useEffect(() => {
        if (currentEnv) {
            setSearchParams({ env: currentEnv });
        }
    }, [currentEnv, setSearchParams]);

    const envConfig = environments.find(e => e.id === currentEnv);

    return {
        currentEnv,
        envConfig,
        setCurrentEnv,
        environments,
    };
}
