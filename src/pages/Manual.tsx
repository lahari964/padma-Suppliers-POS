import { useState, useEffect } from 'react';
import { Search, BookOpen, Languages } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface Section {
  title: string;
  content: string;
}

export default function Manual() {
  const [lang, setLang] = useState<'EN' | 'TE'>('EN');
  const [searchQuery, setSearchQuery] = useState('');
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/${lang === 'EN' ? 'USER_MANUAL_EN' : 'USER_MANUAL_TE'}.md`)
      .then(res => res.text())
      .then(text => {
        // Split by ## 
        const parts = text.split('## ');
        // The first part is usually the title/intro
        const parsed: Section[] = [];
        
        if (parts.length > 0) {
          // skip the very first intro part if we only want numbered sections, 
          // or add it as "Introduction"
          const intro = parts[0].replace(/# /g, '').trim();
          if (intro) parsed.push({ title: lang === 'EN' ? 'Introduction' : 'పరిచయం', content: intro });
        }
        
        for (let i = 1; i < parts.length; i++) {
          const lines = parts[i].split('\n');
          const title = lines[0].trim();
          const content = lines.slice(1).join('\n').trim();
          parsed.push({ title, content });
        }
        
        setSections(parsed);
        setIsLoading(false);
      });
  }, [lang]);

  const filteredSections = sections.filter(sec => 
    sec.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    sec.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatText = (text: string) => {
    // Basic markdown to JSX formatting
    let formatted = text
      .split('\n')
      .map((line, idx) => {
        if (line.trim() === '') return <br key={idx} />;
        if (line.startsWith('- ')) {
           // Bold parsing inside list
           const parts = line.substring(2).split(/\*\*(.*?)\*\*/g);
           return (
             <li key={idx} className="ml-4 list-disc mb-1">
               {parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
             </li>
           );
        }
        
        // Bold parsing in paragraph
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={idx} className="mb-2">
            {parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
          </p>
        );
      });
      
    return <div className="text-sm leading-relaxed text-muted-foreground">{formatted}</div>;
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            {lang === 'EN' ? 'User Manual' : 'యూజర్ మాన్యువల్'}
          </h1>
          <p className="text-muted-foreground mt-1">
             {lang === 'EN' ? 'Search and read the documentation.' : 'డాక్యుమెంటేషన్ చదవండి మరియు వెతకండి.'}
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button 
            variant={lang === 'EN' ? 'default' : 'outline'} 
            onClick={() => setLang('EN')}
            className="flex-1 sm:flex-none h-10 px-4"
          >
            English
          </Button>
          <Button 
            variant={lang === 'TE' ? 'default' : 'outline'} 
            onClick={() => setLang('TE')}
            className="flex-1 sm:flex-none h-10 px-4 flex items-center gap-2"
          >
            <Languages className="w-4 h-4" /> తెలుగు
          </Button>
        </div>
      </div>

      <div className="bg-card p-6 rounded-2xl border border-border flex-1 overflow-hidden flex flex-col">
        <div className="relative mb-6">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder={lang === 'EN' ? 'Search manual (e.g., Billing, Returns)...' : 'సెర్చ్ చేయండి...'} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-xl bg-background border-border text-base"
          />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          {isLoading ? (
            <div className="flex justify-center items-center h-32 text-muted-foreground">Loading...</div>
          ) : filteredSections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {lang === 'EN' ? 'No results found for your search.' : 'మీ సెర్చ్‌కి ఫలితాలు దొరకలేదు.'}
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={filteredSections.map(s => s.title)} className="space-y-3">
              {filteredSections.map((section, idx) => (
                <AccordionItem key={idx} value={section.title} className="bg-background border border-border rounded-xl px-4 overflow-hidden">
                  <AccordionTrigger className="hover:no-underline py-4 text-base font-semibold text-foreground text-left">
                    {section.title}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    {formatText(section.content)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>
    </div>
  );
}
