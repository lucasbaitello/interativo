import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Fundo com blur e gradiente para visual elegante */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black" />
        <div className="absolute inset-0 backdrop-blur-xl opacity-70" />
      </div>

      {/* Conteúdo central */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-shadow">
        <img src="/img/logo.avif" alt="Logo" className="w-44 h-auto mb-10 opacity-90" />

        <div className="glass rounded-2xl p-8 max-w-xl w-full text-center text-shadow">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Interativo 360° • Light Mixing</h1>
          <p className="mt-3 text-neutral-300 leading-relaxed text-shadow">
            Explore a cena equiretangular com controle fino das fontes de luz. Ajuste intensidades e crie atmosferas.
          </p>
          <Link to="/viewer" className="inline-flex items-center justify-center mt-6 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition text-white text-shadow">
            Entrar na Sala de Jantar
          </Link>
        </div>

        <div className="mt-10 text-xs text-neutral-500 text-shadow">Pronto para deploy na Vercel</div>
      </div>
    </div>
  )
}