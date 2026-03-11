import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParsedResume } from './parsed-resume.entity';

@Injectable()
export class AiResumeParserService {
  constructor(@InjectRepository(ParsedResume) private repo: Repository<ParsedResume>) {}

  async parseResume(candidateId: string, resumeText: string): Promise<ParsedResume> {
    const parsedData = this.extractResumeData(resumeText);
    
    const parsed = this.repo.create({
      candidateId,
      rawText: resumeText,
      parsedData,
      status: 'completed'
    });
    
    return this.repo.save(parsed);
  }

  private extractResumeData(text: string): any {
    const data: any = {};
    
    // Extract email
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) data.email = emailMatch[0];
    
    // Extract phone
    const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) data.phone = phoneMatch[0];
    
    // Extract skills (common tech skills)
    const skillKeywords = ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Docker', 'Kubernetes', 'TypeScript', 'Angular', 'Vue', 'MongoDB', 'PostgreSQL', 'Git', 'CI/CD', 'Agile', 'Scrum'];
    data.skills = skillKeywords.filter(skill => text.toLowerCase().includes(skill.toLowerCase()));
    
    // Extract experience (simplified pattern matching)
    const experienceSection = text.match(/experience[:\s]+(.*?)(?=education|skills|$)/is);
    if (experienceSection) {
      data.experience = this.parseExperience(experienceSection[1]);
    }
    
    // Extract education
    const educationSection = text.match(/education[:\s]+(.*?)(?=experience|skills|$)/is);
    if (educationSection) {
      data.education = this.parseEducation(educationSection[1]);
    }
    
    // Calculate total experience (years)
    const yearsMatch = text.match(/(\d+)\+?\s*years?/i);
    if (yearsMatch) data.totalExperience = parseInt(yearsMatch[1]);
    
    // Extract summary
    const summaryMatch = text.match(/summary[:\s]+(.*?)(?=experience|education|skills|$)/is);
    if (summaryMatch) data.summary = summaryMatch[1].trim().substring(0, 500);
    
    return data;
  }

  private parseExperience(text: string): any[] {
    const experiences = [];
    const lines = text.split('\n').filter(l => l.trim());
    
    for (let i = 0; i < lines.length; i += 3) {
      if (lines[i]) {
        experiences.push({
          position: lines[i]?.trim() || '',
          company: lines[i + 1]?.trim() || '',
          duration: lines[i + 2]?.trim() || '',
          description: ''
        });
      }
    }
    
    return experiences.slice(0, 5);
  }

  private parseEducation(text: string): any[] {
    const education = [];
    const lines = text.split('\n').filter(l => l.trim());
    
    for (let i = 0; i < lines.length; i += 2) {
      if (lines[i]) {
        education.push({
          degree: lines[i]?.trim() || '',
          institution: lines[i + 1]?.trim() || '',
          year: ''
        });
      }
    }
    
    return education.slice(0, 3);
  }

  async findAll(): Promise<ParsedResume[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<ParsedResume> {
    return this.repo.findOne({ where: { id } });
  }

  async findByCandidate(candidateId: string): Promise<ParsedResume[]> {
    return this.repo.find({ where: { candidateId } });
  }
}
