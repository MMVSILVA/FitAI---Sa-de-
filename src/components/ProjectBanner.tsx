import React from 'react';
import { Project } from '../services/supabase';

interface ProjectBannerProps {
  project: Project;
}

export const ProjectBanner: React.FC<ProjectBannerProps> = ({ project }) => {
  return (
    <div id="project-banner-export" className="w-[1200px] h-[1697px] bg-[#ffffff] text-[#000000] font-sans relative overflow-hidden" style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#005099 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>

      {/* Header */}
      <div className="flex justify-between items-start pt-12 px-12">
        <div className="bg-[#005099] text-[#ffffff] p-10 rounded-br-[100px] w-2/3 relative z-10">
          <h1 className="text-6xl font-black mb-4 uppercase tracking-tighter">PROJETO INTEGRADOR</h1>
          <h2 className="text-3xl font-light">{project.name}</h2>
        </div>
        <div className="w-1/3 flex flex-col items-end pr-12 pt-4 relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <span className="text-[#005099] font-black text-5xl tracking-tighter">Firjan</span>
            <span className="text-[#00A0E3] font-black text-5xl tracking-tighter">SENAI</span>
          </div>
          <div className="bg-[#A0D2C8] p-6 rounded-tl-[50px] rounded-br-[50px] text-right w-full">
            <p className="font-bold text-[#005099] text-xl mb-4">Equipe:</p>
            <p className="text-[#1f2937] text-lg leading-relaxed">
              {project.teamMembers?.length ? project.teamMembers.map(m => m.name).join(', ') : 'Alunos da Turma'}
            </p>
            <div className="mt-6 pt-4 border-t border-[#ffffff80]">
              <p className="text-sm font-bold text-[#005099]">Curso: {project.curso}</p>
              <p className="text-sm font-bold text-[#005099]">Turma: {project.turma}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-2 gap-12 p-12 mt-8 relative z-10">
        
        {/* Left Column */}
        <div className="space-y-12">
          {/* Introdução */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-[#005099] text-[#ffffff] w-16 h-16 flex items-center justify-center text-3xl font-black rounded-lg">1</div>
              <h3 className="text-[#005099] text-4xl font-black uppercase">Introdução</h3>
            </div>
            <div className="text-[#374151] text-xl leading-relaxed text-justify border-l-4 border-[#00A0E3] pl-6">
              {project.description}
            </div>
          </div>

          {/* Metodologia */}
          <div className="bg-[#A0D2C8] p-8 rounded-3xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-[#005099] text-[#ffffff] w-16 h-16 flex items-center justify-center text-3xl font-black rounded-lg">2</div>
              <h3 className="text-[#ffffff] text-4xl font-black uppercase drop-shadow-md">Metodologia</h3>
            </div>
            <div className="bg-[#ffffffcc] p-6 rounded-2xl text-[#1f2937] text-xl leading-relaxed text-justify">
              O projeto foi desenvolvido utilizando metodologias ativas de aprendizagem, com foco na resolução de problemas reais da indústria. A equipe aplicou conceitos teóricos na prática, desenvolvendo um protótipo funcional e validando a solução proposta.
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-12">
          {/* Resultados */}
          <div className="bg-[#005099] p-8 rounded-3xl text-[#ffffff]">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-[#ffffff] text-[#005099] w-16 h-16 flex items-center justify-center text-3xl font-black rounded-lg">3</div>
              <h3 className="text-[#ffffff] text-4xl font-black uppercase">Resultados</h3>
            </div>
            <div className="bg-[#ffffff1a] p-6 rounded-2xl text-[#ffffff] text-xl leading-relaxed text-justify">
              A solução desenvolvida demonstrou viabilidade técnica e potencial de aplicação no mercado. Os testes realizados indicaram melhorias significativas nos processos analisados, confirmando a eficácia da proposta.
            </div>
          </div>

          {/* Conclusão */}
          <div className="bg-[#f3f4f6] p-8 rounded-3xl border-2 border-[#00509933]">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-[#005099] text-[#ffffff] w-16 h-16 flex items-center justify-center text-3xl font-black rounded-lg">4</div>
              <h3 className="text-[#005099] text-4xl font-black uppercase">Conclusão</h3>
            </div>
            <div className="text-[#374151] text-xl leading-relaxed text-justify">
              O Projeto Integrador permitiu a consolidação dos conhecimentos adquiridos ao longo do curso, preparando os alunos para os desafios do mercado de trabalho. A experiência prática reforçou a importância do trabalho em equipe e da inovação tecnológica.
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#005099] text-[#ffffff] p-6 text-center">
        <p className="text-lg font-bold">Professor Orientador: {project.professorName}</p>
      </div>
    </div>
  );
};
