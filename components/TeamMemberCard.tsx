
import React from 'react';
import type { TeamMember } from '../types';
import { LinkedinIcon, LinkIcon } from './Icons';

interface TeamMemberCardProps {
  member: TeamMember;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member }) => {
  return (
    <div className="bg-white rounded-lg p-6 text-center group transition-all duration-300 transform hover:-translate-y-2 hover:shadow-lg hover:shadow-slate-400/20 w-80 border border-slate-200">
      <img
        src={member.photoUrl}
        alt={member.name}
        className={`w-32 h-32 rounded-full mx-auto mb-4 border-4 border-slate-200 group-hover:border-cyan-400 object-cover ${member.objectPosition || 'object-center'}`}
      />
      <h3 className="text-xl font-bold text-slate-900">{member.name}</h3>
      <div className="mt-4 flex justify-center space-x-4">
        <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-400 transition-colors">
          <LinkedinIcon className="h-6 w-6" />
        </a>
        <a href={member.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-400 transition-colors">
          <LinkIcon className="h-6 w-6" />
        </a>
      </div>
    </div>
  );
};

export default TeamMemberCard;