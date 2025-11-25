
import React, { useContext, useState, useEffect, useRef } from 'react';
import { StoreContext } from '../store';
import { 
    Search, Plus, MessageSquare, Users, MoreVertical, Send, 
    Paperclip, Smile, Phone, Video, X, ArrowLeft, ChevronLeft,
    Bot, Sparkles, Zap, ExternalLink
} from 'lucide-react';
import { formatDistanceToNow, format, isSameDay, startOfWeek, endOfWeek, addDays, isWithinInterval } from 'date-fns';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { UserRole, Chat, ChatMessage, InvoiceStatus, JobStatus, Client, Job, Quote, QuoteStatus, Invoice } from '../types';
import { Link } from 'react-router-dom';

// --- RICH TEXT RENDERER COMPONENT ---
const RichMessage: React.FC<{ content: string }> = ({ content }) => {
    const lines = content.split('\n');

    return (
        <div className="space-y-1">
            {lines.map((line, i) => {
                if (!line.trim()) return <br key={i} />;

                const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                const parts = [];
                let lastIndex = 0;
                let match;

                while ((match = linkRegex.exec(line)) !== null) {
                    if (match.index > lastIndex) {
                        parts.push(parseBold(line.substring(lastIndex, match.index)));
                    }
                    parts.push(
                        <Link 
                            key={`${i}-${match.index}`} 
                            to={match[2]} 
                            className="text-indigo-600 dark:text-indigo-400 underline font-bold inline-flex items-center gap-0.5 hover:text-indigo-800"
                        >
                            {match[1]} <ExternalLink className="w-3 h-3" />
                        </Link>
                    );
                    lastIndex = linkRegex.lastIndex;
                }
                if (lastIndex < line.length) {
                    parts.push(parseBold(line.substring(lastIndex)));
                }

                return <p key={i} className="leading-relaxed">{parts}</p>;
            })}
        </div>
    );
};

const parseBold = (text: string) => {
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-bold">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
    }
    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }
    return parts.length > 0 ? parts : text;
};


export const Communication: React.FC = () => {
  const store = useContext(StoreContext);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Create Group State
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [store?.messages.length, selectedChatId, isAiTyping]);

  if (!store) return null;

  const { 
      chats, messages, users, currentUser, sendMessage, createChat, 
      invoices, jobs, clients, addJob, addClient, assignJob,
      inventoryProducts, inventoryRecords, addQuote, createInvoice,
      cancelJob, quotes
  } = store;

  const AI_CHAT_ID = 'ai-assistant-chat';
  const isAISelected = selectedChatId === AI_CHAT_ID;

  // --- AGENTIC AI ENGINE ---
  const runAgenticWorkflow = async (input: string) => {
      setIsAiTyping(true);
      
      // Simulate AI processing thought
      await new Promise(resolve => setTimeout(resolve, 1200));

      const lowerInput = input.toLowerCase();
      let responseParts: string[] = [];
      let handled = false;

      // Helper to send response
      const reply = (lines: string[]) => {
          store.sendMessage(AI_CHAT_ID, lines.join('\n'), 'ai-bot');
          handled = true;
      };

      // Helper: Fuzzy Client Search
      const findClient = (name: string) => {
          return clients.find(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(name.toLowerCase()));
      };

      // 1. 💰 PROJECTED REVENUE PREDICTION
      if (!handled && lowerInput.match(/(?:projected|weekly|week|this week)\s+revenue/i)) {
          const now = new Date();
          const start = new Date(); // Today
          const end = addDays(new Date(), 7); // Next 7 days
          
          const weeklyJobs = jobs.filter(j => {
              const d = new Date(j.start);
              return isWithinInterval(d, { start, end }) && j.status !== JobStatus.CANCELLED;
          });
          
          const total = weeklyJobs.reduce((sum, job) => sum + job.items.reduce((s, i) => s + i.total, 0), 0);
          const jobCount = weeklyJobs.length;

          responseParts.push(`💰 **Weekly Revenue Projection**`);
          responseParts.push(`Looking at the schedule for the next 7 days, things are looking good!`);
          responseParts.push(`We have **${jobCount} active jobs** scheduled, projecting a total revenue of **$${total.toLocaleString()}**.`);
          
          if (jobCount > 0) {
              responseParts.push(`\n**Top Value Job:**`);
              const topJob = [...weeklyJobs].sort((a,b) => b.items.reduce((s,i)=>s+i.total,0) - a.items.reduce((s,i)=>s+i.total,0))[0];
              const topVal = topJob.items.reduce((s,i)=>s+i.total,0);
              responseParts.push(`• ${topJob.title} for ${clients.find(c=>c.id===topJob.clientId)?.lastName}: **$${topVal}**`);
          }
          reply(responseParts);
      }

      // 2. 📅 CHECK TECHNICIAN AVAILABILITY
      else if (!handled && lowerInput.match(/(?:is|check if)\s+(.+?)\s+(?:free|available)/i)) {
          const match = input.match(/(?:is|check if)\s+(.+?)\s+(?:free|available)(?:\s+on\s+(.+))?/i);
          const name = match?.[1];
          const dateStr = match?.[2] || 'today';
          
          const tech = users.find(u => u.name.toLowerCase().includes(name!.toLowerCase()));
          
          if (tech) {
              const checkDate = dateStr.toLowerCase() === 'today' ? new Date() : new Date(dateStr); // Simple parse
              const techJobs = jobs.filter(j => j.assignedTechIds.includes(tech.id) && isSameDay(new Date(j.start), checkDate) && j.status !== JobStatus.CANCELLED);
              
              if (techJobs.length === 0) {
                  responseParts.push(`✅ **${tech.name.split(' ')[0]} is fully available** on ${dateStr}.`);
                  responseParts.push(`Their schedule is currently clear.`);
              } else {
                  responseParts.push(`📅 **${tech.name.split(' ')[0]} is busy** with ${techJobs.length} jobs on ${dateStr}:`);
                  techJobs.forEach(j => {
                      responseParts.push(`• ${format(new Date(j.start), 'h:mm a')}: ${j.title}`);
                  });
              }
          } else {
              responseParts.push(`❓ I couldn't find a team member named "${name}".`);
          }
          reply(responseParts);
      }

      // 3. ❌ CANCEL JOB
      else if (!handled && lowerInput.match(/(?:cancel)\s+(?:the\s+)?(?:job|appointment)\s+(?:for|of)\s+(.+)/i)) {
          const match = input.match(/(?:cancel)\s+(?:the\s+)?(?:job|appointment)\s+(?:for|of)\s+(.+)/i);
          const clientName = match?.[1];
          const client = findClient(clientName || '');

          if (client) {
              const job = jobs.find(j => j.clientId === client.id && (j.status === JobStatus.SCHEDULED || j.status === JobStatus.IN_PROGRESS));
              if (job) {
                  cancelJob(job.id, "Cancelled via AI Assistant");
                  responseParts.push(`🚫 **Job Cancelled**`);
                  responseParts.push(`I've cancelled the **${job.title}** for ${client.firstName} ${client.lastName}.`);
                  responseParts.push(`The team has been notified and the slot is now open.`);
              } else {
                  responseParts.push(`ℹ️ ${client.firstName} doesn't have an active job to cancel right now.`);
              }
          } else {
              responseParts.push(`❓ I couldn't find a client named "${clientName}".`);
          }
          reply(responseParts);
      }

      // 4. 📋 TODAY'S SCHEDULE
      else if (!handled && lowerInput.match(/(?:schedule|jobs|appointments)\s+(?:for\s+)?today/i)) {
          const today = new Date();
          const todaysJobs = jobs.filter(j => isSameDay(new Date(j.start), today) && j.status !== JobStatus.CANCELLED)
                                 .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

          if (todaysJobs.length > 0) {
              responseParts.push(`📝 **Today's Agenda (${todaysJobs.length} Jobs)**`);
              todaysJobs.forEach(j => {
                  const tech = users.find(u => u.id === j.assignedTechIds[0]);
                  responseParts.push(`• **${format(new Date(j.start), 'h:mm a')}**: ${j.title} _(${tech ? tech.name.split(' ')[0] : 'Unassigned'})_`);
              });
              responseParts.push(`\n[View Full Schedule](/schedule)`);
          } else {
              responseParts.push(`☕ **The schedule is clear for today.**`);
              responseParts.push(`No jobs are currently scheduled.`);
          }
          reply(responseParts);
      }

      // 5. 📜 CLIENT HISTORY
      else if (!handled && lowerInput.match(/(?:history|past jobs)\s+(?:for|of)\s+(.+)/i)) {
          const match = input.match(/(?:history|past jobs)\s+(?:for|of)\s+(.+)/i);
          const clientName = match?.[1];
          const client = findClient(clientName || '');

          if (client) {
              const pastJobs = jobs.filter(j => j.clientId === client.id && j.status === JobStatus.COMPLETED);
              const totalSpent = pastJobs.reduce((sum, j) => sum + j.items.reduce((s, i) => s + i.total, 0), 0);

              responseParts.push(`📂 **History for ${client.firstName} ${client.lastName}**`);
              responseParts.push(`They have completed **${pastJobs.length} jobs** with us, totaling **$${totalSpent.toLocaleString()}** in lifetime value.`);
              
              if (pastJobs.length > 0) {
                  responseParts.push(`\n**Recent Visits:**`);
                  pastJobs.slice(0, 3).forEach(j => {
                      responseParts.push(`• ${new Date(j.end).toLocaleDateString()}: ${j.title}`);
                  });
              }
              responseParts.push(`\n[View Client Profile](/clients/${client.id})`);
          } else {
              responseParts.push(`❓ Client "${clientName}" not found.`);
          }
          reply(responseParts);
      }

      // 6. 📦 INVENTORY CHECK
      else if (!handled && lowerInput.match(/(?:check|stock|inventory)\s+(?:for|of)\s+(.+)/i)) {
          const match = input.match(/(?:check|stock|inventory)\s+(?:for|of)\s+(.+)/i);
          const query = match?.[1].trim().toLowerCase();
          
          const product = inventoryProducts.find(p => p.name.toLowerCase().includes(query!) || p.sku.toLowerCase().includes(query!));
          
          if (product) {
              const totalStock = inventoryRecords.filter(r => r.productId === product.id).reduce((acc, r) => acc + r.quantity, 0);
              responseParts.push(`📦 **Inventory Check: ${product.name}**`);
              responseParts.push(`We currently have **${totalStock} ${product.unit}(s)** in stock across all locations.`);
              
              if (totalStock <= product.minStock) {
                  responseParts.push(`⚠️ **Low Stock Warning:** We are below the minimum level of ${product.minStock}.`);
                  responseParts.push(`[Order More](/inventory/orders)`);
              }
          } else {
              responseParts.push(`❓ I couldn't find a product matching "${query}". Try searching by SKU or full name.`);
          }
          reply(responseParts);
      }

      // 7. 📄 DRAFT QUOTE
      else if (!handled && lowerInput.match(/(?:draft|create)\s+(?:a\s+)?quote\s+for\s+(.+?)\s+(?:for|amount)\s+(\$?\d+)/i)) {
          const match = input.match(/(?:draft|create)\s+(?:a\s+)?quote\s+for\s+(.+?)\s+(?:for|amount)\s+(\$?\d+)/i);
          const clientName = match?.[1];
          const amountStr = match?.[2].replace('$', '');
          const client = findClient(clientName || '');

          if (client && amountStr) {
              const amount = parseFloat(amountStr);
              const newQuote: Quote = {
                  id: `quote-${Date.now()}`,
                  clientId: client.id,
                  propertyId: client.properties[0].id,
                  items: [{ id: `item-${Date.now()}`, description: 'Service Estimate (AI Generated)', quantity: 1, unitPrice: amount, total: amount }],
                  subtotal: amount,
                  tax: amount * 0.08,
                  total: amount * 1.08,
                  status: QuoteStatus.DRAFT,
                  issuedDate: new Date().toISOString(),
                  expiryDate: addDays(new Date(), 14).toISOString()
              };
              addQuote(newQuote);
              responseParts.push(`📄 **Quote Drafted**`);
              responseParts.push(`I've created a draft quote for **${client.firstName}** for **$${amount.toLocaleString()}**.`);
              responseParts.push(`You can review and send it from the quotes tab.`);
              responseParts.push(`[View Quote](/quotes)`);
          } else {
              responseParts.push(`❓ I couldn't process that. Please specify a valid client name and amount.`);
          }
          reply(responseParts);
      }

      // 8. 📨 SEND INVOICE
      else if (!handled && lowerInput.match(/(?:send|create)\s+(?:an\s+)?invoice\s+for\s+(.+)/i)) {
          const match = input.match(/(?:send|create)\s+(?:an\s+)?invoice\s+for\s+(.+)/i);
          const clientName = match?.[1];
          const client = findClient(clientName || '');

          if (client) {
              // Find last completed job that isn't invoiced? Mocking simply creating one.
              const newInvoice: Invoice = {
                  id: `inv-${Date.now()}`,
                  clientId: client.id,
                  items: [{ id: `item-${Date.now()}`, description: 'Service Visit', quantity: 1, unitPrice: 250, total: 250 }],
                  subtotal: 250,
                  tax: 20,
                  total: 270,
                  balanceDue: 270,
                  status: InvoiceStatus.SENT,
                  dueDate: addDays(new Date(), 14).toISOString(),
                  issuedDate: new Date().toISOString(),
                  payments: []
              };
              createInvoice(newInvoice);
              
              responseParts.push(`📨 **Invoice Sent**`);
              responseParts.push(`I've generated and sent Invoice #${newInvoice.id} to **${client.email}**.`);
              responseParts.push(`Total Amount: **$270.00**`);
              responseParts.push(`[View Invoice](/invoices)`);
          } else {
              responseParts.push(`❓ Client "${clientName}" not found.`);
          }
          reply(responseParts);
      }

      // 9. 📍 LOCATE TECHNICIAN
      else if (!handled && lowerInput.match(/(?:where is|locate)\s+(.+)/i)) {
          const match = input.match(/(?:where is|locate)\s+(.+)/i);
          const name = match?.[1];
          const tech = users.find(u => u.name.toLowerCase().includes(name!.toLowerCase()));

          if (tech) {
              // Check active job
              const activeJob = jobs.find(j => j.assignedTechIds.includes(tech.id) && j.status === JobStatus.IN_PROGRESS);
              
              if (activeJob) {
                  const client = clients.find(c => c.id === activeJob.clientId);
                  responseParts.push(`📍 **${tech.name.split(' ')[0]} is currently active.**`);
                  responseParts.push(`They are at **${activeJob.title}** for ${client?.firstName}.`);
                  responseParts.push(`Location: ${client?.properties.find(p=>p.id===activeJob.propertyId)?.address.street}`);
              } else {
                  responseParts.push(`📍 **${tech.name.split(' ')[0]} is not on a job.**`);
                  responseParts.push(`Last known status: Available/Idle.`);
              }
          } else {
              responseParts.push(`❓ Technician not found.`);
          }
          reply(responseParts);
      }

      // 10. ⚠️ OVERDUE SUMMARY
      else if (!handled && lowerInput.match(/(?:overdue|unpaid)\s+(?:invoices|bills)/i)) {
          const overdueInvoices = invoices.filter(i => i.status === InvoiceStatus.OVERDUE);
          const totalOverdue = overdueInvoices.reduce((sum, i) => sum + i.balanceDue, 0);

          if (overdueInvoices.length > 0) {
              responseParts.push(`⚠️ **Overdue Payment Summary**`);
              responseParts.push(`We have **${overdueInvoices.length} overdue invoices** totaling **$${totalOverdue.toLocaleString()}**.`);
              responseParts.push(`\n**Oldest Unpaid:**`);
              overdueInvoices.slice(0, 3).forEach(inv => {
                  const client = clients.find(c => c.id === inv.clientId);
                  responseParts.push(`• ${client?.lastName}: $${inv.balanceDue} (Due ${new Date(inv.dueDate).toLocaleDateString()})`);
              });
              responseParts.push(`\n[Manage Invoices](/invoices)`);
          } else {
              responseParts.push(`✅ **No overdue invoices!**`);
              responseParts.push(`Everyone is paid up. Great job!`);
          }
          reply(responseParts);
      }

      // 11. CREATE CLIENT & JOB (Legacy + Enhanced)
      else if (!handled) {
          let targetClientId: string | undefined = undefined;
          let targetClientName = "";
          let targetClientObject: Client | undefined = undefined;
          let createdJob: Job | undefined = undefined;

          // Regex Extractors
          const nameMatch = input.match(/(?:named|client|for)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/) || input.match(/^([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/);
          const extractedName = nameMatch ? nameMatch[1] : null;

          // Check if creating client
          const wantsCreateClient = lowerInput.match(/create (?:a )?new client|add client/i) || (lowerInput.match(/create (?:a )?new job/i) && !findClient(extractedName || 'XYZ'));
          
          if (wantsCreateClient && extractedName) {
              // Extraction
              const phoneMatch = input.match(/(\d{3}[-.]?\d{3}[-.]?\d{4})/);
              const emailMatch = input.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
              const addressMatch = input.match(/(?:address is|at)\s+([^.\n]+)/i);
              
              const newClient: Client = {
                  id: `client-${Date.now()}`,
                  firstName: extractedName.split(' ')[0],
                  lastName: extractedName.split(' ').slice(1).join(' '),
                  email: emailMatch ? emailMatch[1] : `${extractedName.replace(/\s/g,'.').toLowerCase()}@example.com`,
                  phone: phoneMatch ? phoneMatch[1] : '(555) 000-0000',
                  billingAddress: {
                      street: addressMatch ? addressMatch[1].split(',')[0].trim() : 'Unknown Address',
                      city: addressMatch && addressMatch[1].includes(',') ? addressMatch[1].split(',')[1].trim() : 'Lubbock',
                      state: 'TX',
                      zip: '79401'
                  },
                  properties: [{
                      id: `prop-${Date.now()}`,
                      clientId: `client-${Date.now()}`,
                      address: {
                          street: addressMatch ? addressMatch[1].split(',')[0].trim() : 'Unknown Address',
                          city: addressMatch && addressMatch[1].includes(',') ? addressMatch[1].split(',')[1].trim() : 'Lubbock',
                          state: 'TX',
                          zip: '79401'
                      },
                      accessInstructions: 'Gate code: N/A'
                  }],
                  tags: ['New'],
                  createdAt: new Date().toISOString()
              };
              
              addClient(newClient);
              targetClientId = newClient.id;
              targetClientName = extractedName;
              targetClientObject = newClient;
              responseParts.push(`✅ **New Client Created:** ${extractedName}`);
              responseParts.push(`I've added their details to the database.`);
              responseParts.push(`[View Profile](/clients/${newClient.id})`);
              responseParts.push(`---`);
          } else if (extractedName) {
              const existing = findClient(extractedName);
              if (existing) {
                  targetClientId = existing.id;
                  targetClientName = `${existing.firstName} ${existing.lastName}`;
                  targetClientObject = existing;
              }
          }

          // Check if creating job
          const wantsCreateJob = lowerInput.match(/create (?:a )?new job|add job|schedule|starts/i);
          
          if (wantsCreateJob && targetClientId) {
              const vehicleMatch = input.match(/(?:owns|vehicle|car)\s+(?:a|an)?\s*([^.\n,-]+)/i);
              const dateMatch = input.match(/(?:starts|on)\s+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?)/i); 
              const timeMatch = input.match(/\b((?:1[0-2]|0?[1-9])(?::\d{2})?\s*(?:AM|PM))/i);
              const durationMatch = input.match(/(?:last|duration)\s+(?:about\s+)?(\d+)\s*(?:minutes|hours|mins|hrs)/i);
              
              let extractedTitle = 'Service Visit';
              // Heuristics for Title
              const explicitMatch = input.match(/(?:job|service) is\s+([^.\n,]+)/i);
              const verbMatch = input.match(/\b(cleaning|washing|detailing|repairing|fixing|replacing|installing|check)\b\s+([^.\n,]+)/i);

              if (explicitMatch) {
                  extractedTitle = explicitMatch[1].trim();
              } else if (verbMatch) {
                  let text = `${verbMatch[1]} ${verbMatch[2]}`.trim();
                  text = text.replace(/\b(?:his|her|their|my|the)\b\s+/gi, '');
                  extractedTitle = text.charAt(0).toUpperCase() + text.slice(1);
              }
              extractedTitle = extractedTitle.replace(/[.,;!?]+$/, '');

              // Date Logic
              let startDate = new Date();
              startDate.setDate(startDate.getDate() + 1); 
              startDate.setHours(9, 0, 0, 0); 

              if (dateMatch) {
                  const cleanDateStr = dateMatch[1].replace(/(st|nd|rd|th)/, '');
                  const parsedDate = new Date(`${cleanDateStr} ${new Date().getFullYear()}`);
                  if (!isNaN(parsedDate.getTime())) startDate = parsedDate;
              }

              if (timeMatch) {
                  const timeStr = timeMatch[1];
                  const timeParts = timeStr.match(/(\d+)(?::(\d+))?\s*(AM|PM)/i);
                  if (timeParts) {
                      let hours = parseInt(timeParts[1]);
                      const mins = parseInt(timeParts[2] || '0');
                      const isPm = timeParts[3].toUpperCase() === 'PM';
                      if (isPm && hours < 12) hours += 12;
                      if (!isPm && hours === 12) hours = 0;
                      startDate.setHours(hours, mins);
                  }
              }

              let durationMins = 60;
              if (durationMatch) {
                  const val = parseInt(durationMatch[1]);
                  const unit = durationMatch[0].toLowerCase();
                  if (unit.includes('hour')) durationMins = val * 60;
                  else durationMins = val;
              }

              const endDate = new Date(startDate.getTime() + durationMins * 60000);
              const propertyId = targetClientObject ? targetClientObject.properties[0].id : (clients.find(c => c.id === targetClientId)?.properties[0].id || 'prop-unknown');

              const newJob: Job = {
                  id: `job-${Date.now()}`,
                  clientId: targetClientId,
                  propertyId: propertyId,
                  assignedTechIds: [], 
                  title: extractedTitle,
                  description: `Created by AI Assistant. Request: ${input}`,
                  start: startDate.toISOString(),
                  end: endDate.toISOString(),
                  status: JobStatus.SCHEDULED,
                  priority: 'MEDIUM',
                  vehicleDetails: { 
                      make: vehicleMatch ? vehicleMatch[1].split(' ')[1] || 'Unknown' : 'Vehicle', 
                      model: vehicleMatch ? vehicleMatch[1].split(' ').slice(2).join(' ') || 'Model' : 'Details', 
                      year: vehicleMatch ? vehicleMatch[1].split(' ')[0] || '2024' : '2024', 
                      color: 'N/A', 
                      type: 'Car' 
                  },
                  items: [{ id: `item-${Date.now()}`, description: extractedTitle, quantity: 1, unitPrice: 150, total: 150 }],
                  checklists: [],
                  photos: [],
                  notes: ''
              };

              addJob(newJob);
              createdJob = newJob;
              responseParts.push(`🚗 **Job Scheduled:** ${newJob.title}`);
              responseParts.push(`**When:** ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`);
              responseParts.push(`[View Job](/jobs/${newJob.id})`);
          } else if (wantsCreateJob && !targetClientId) {
              responseParts.push(`⚠️ I couldn't determine which client to create the job for.`);
              responseParts.push(`Please specify a name like "create job for John...".`);
          }

          // Assignment Logic
          const assignMatch = input.match(/(?:assign|give|schedule)\s+(?:this|it|job)?\s*(?:to|for)?\s+(.+)/i);
          if (assignMatch) {
              const queryRaw = assignMatch[1].trim();
              const queryClean = queryRaw.replace(/'s\b/g, '').replace(/[^\w\s]/g, '').toLowerCase();
              
              const tech = users.find(u => u.name.toLowerCase().includes(queryClean));

              if (tech) {
                  let targetJob = createdJob;
                  if (!targetJob) {
                       // Last created job
                       const sortedJobs = [...jobs].sort((a,b) => parseInt(b.id.split('-')[1]) - parseInt(a.id.split('-')[1]));
                       targetJob = sortedJobs[0];
                  }

                  if (targetJob) {
                       assignJob(targetJob.id, tech.id, targetJob);
                       responseParts.push(`---`);
                       responseParts.push(`👷 **Assigned to:** ${tech.name}`);
                       responseParts.push(`Notification sent.`);
                  } else {
                       responseParts.push(`⚠️ I found ${tech.name}, but I'm not sure which job to assign.`);
                  }
              } else {
                  responseParts.push(`⚠️ I couldn't find a team member matching "${queryRaw}".`);
              }
          }

          // Final Fallback
          if (responseParts.length === 0) {
              responseParts.push("I can help you run your business. Here are some things I can do:");
              responseParts.push("* \"What is the projected revenue for this week?\"");
              responseParts.push("* \"Is Marcus free tomorrow?\"");
              responseParts.push("* \"Create a job for John Doe next Friday\"");
              responseParts.push("* \"Send an invoice for the last job\"");
              responseParts.push("* \"Check inventory for Ceramic Coating\"");
          }
          
          reply(responseParts);
      }

      setIsAiTyping(false);
  };

  // Chat Sorting & Filtering
  const sortedChats = [...chats].sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
      return timeB - timeA;
  });

  const regularChats = sortedChats.filter(c => c.id !== AI_CHAT_ID);

  const activeChat = isAISelected 
    ? { id: AI_CHAT_ID, type: 'DIRECT', participantIds: ['ai-bot'] } 
    : chats.find(c => c.id === selectedChatId);
    
  const activeMessages = messages
    .filter(m => m.chatId === (isAISelected ? AI_CHAT_ID : selectedChatId))
    .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const getChatDetails = (chat: any) => {
      if (chat.id === AI_CHAT_ID) return { name: 'Gemini Assistant', avatar: null, isOnline: true, isBot: true };
      if (chat.type === 'GROUP') return { name: chat.name, avatar: null, isOnline: false };
      const otherUserId = chat.participantIds.find((id: string) => id !== currentUser.id);
      const otherUser = users.find(u => u.id === otherUserId);
      return { name: otherUser?.name || 'Unknown User', avatar: otherUser?.avatarUrl, isOnline: true };
  };

  const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (!messageInput.trim() || !selectedChatId) return;
      
      const input = messageInput;
      
      // 1. Send User Message
      sendMessage(selectedChatId, input);
      setMessageInput('');
      
      // 2. Trigger AI if selected
      if (isAISelected) {
          runAgenticWorkflow(input);
      }
  };

  const handleCreateGroup = () => {
      if (!groupName || selectedMembers.length === 0) return;
      createChat(selectedMembers, groupName);
      setIsGroupModalOpen(false);
      setGroupName('');
      setSelectedMembers([]);
  };

  const toggleMemberSelection = (userId: string) => {
      if (selectedMembers.includes(userId)) {
          setSelectedMembers(selectedMembers.filter(id => id !== userId));
      } else {
          setSelectedMembers([...selectedMembers, userId]);
      }
  };

  return (
    <div className="h-[calc(100vh-120px)] md:h-[calc(100vh-140px)] flex flex-col md:flex-row bg-white dark:bg-slate-800 md:rounded-2xl md:border border-slate-200 dark:border-slate-700 md:shadow-sm overflow-hidden -mx-4 md:mx-0 mt-[-1rem] md:mt-0">
        
        {/* LEFT COLUMN: Chat List */}
        <div className={`${selectedChatId ? 'hidden md:flex' : 'flex'} w-full md:w-80 md:border-r border-slate-200 dark:border-slate-700 flex-col bg-slate-50/30 dark:bg-slate-900/30 h-full`}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 md:bg-transparent">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Messages</h2>
                    {currentUser.role === UserRole.ADMIN && (
                        <button 
                            onClick={() => setIsGroupModalOpen(true)} 
                            className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-600 dark:text-slate-300"
                            title="Create Group"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    )}
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-900 border-transparent border focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 dark:focus:border-emerald-500 rounded-xl text-sm focus:outline-none transition-all text-slate-900 dark:text-white"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-800">
                
                {/* PINNED AI ASSISTANT */}
                <div 
                    onClick={() => setSelectedChatId(AI_CHAT_ID)}
                    className={`p-4 flex items-center gap-3 cursor-pointer transition-all border-b border-slate-100 dark:border-slate-700 relative overflow-hidden group ${isAISelected ? 'bg-indigo-50/80 dark:bg-indigo-900/20 md:border-l-4 md:border-l-indigo-500' : 'hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 md:border-l-4 md:border-l-transparent'}`}
                >
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                    <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <Bot className="w-7 h-7" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0 relative z-10">
                        <div className="flex justify-between items-center mb-0.5">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                Gemini Assistant 
                                <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-full uppercase font-bold border border-indigo-200 dark:border-indigo-700 flex items-center gap-1">
                                    <Sparkles className="w-2 h-2" /> AI
                                </span>
                            </h3>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                            Automated Agent
                        </p>
                    </div>
                </div>

                {/* Regular Chats */}
                {regularChats.map(chat => {
                    const details = getChatDetails(chat);
                    const isSelected = selectedChatId === chat.id;
                    
                    return (
                        <div 
                            key={chat.id}
                            onClick={() => setSelectedChatId(chat.id)}
                            className={`p-4 flex items-center gap-3 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0 ${isSelected ? 'bg-white dark:bg-slate-700/50 shadow-sm md:border-l-4 md:border-l-emerald-500' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30 md:border-l-4 md:border-l-transparent'}`}
                        >
                            <div className="relative">
                                {details.avatar ? (
                                    <img src={details.avatar} className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-600" alt="" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                        <Users className="w-6 h-6" />
                                    </div>
                                )}
                                {details.isOnline && chat.type === 'DIRECT' && (
                                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className={`font-bold truncate text-base ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'}`}>{details.name}</h3>
                                    {chat.lastMessage && (
                                        <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0 font-medium">
                                            {formatDistanceToNow(new Date(chat.lastMessage.timestamp), { addSuffix: false })}
                                        </span>
                                    )}
                                </div>
                                <p className={`text-sm truncate ${isSelected ? 'text-slate-600 dark:text-slate-300 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {chat.lastMessage ? (
                                        <>
                                            {chat.lastMessage.senderId === currentUser.id && <span className="font-semibold text-slate-700 dark:text-slate-300">You: </span>}
                                            {chat.lastMessage.content}
                                        </>
                                    ) : (
                                        <span className="italic text-slate-400 dark:text-slate-500">No messages yet</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* RIGHT COLUMN: Main Chat Area */}
        <div className={`${selectedChatId ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white dark:bg-slate-800 relative h-full w-full`}>
            {selectedChatId ? (
                <>
                    {/* Chat Header */}
                    <div className={`h-16 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center px-4 md:px-6 shrink-0 z-10 ${isAISelected ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : 'bg-white dark:bg-slate-800'}`}>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setSelectedChatId(null)}
                                className="md:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            
                            <div className="relative">
                                {isAISelected ? (
                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white">
                                        <Bot className="w-5 h-5" />
                                    </div>
                                ) : getChatDetails(activeChat).avatar ? (
                                    <img src={getChatDetails(activeChat).avatar!} className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-600" alt="" />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                        <Users className="w-5 h-5" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="font-bold text-slate-900 dark:text-white text-base leading-tight flex items-center gap-2">
                                    {isAISelected ? 'Gemini Assistant' : getChatDetails(activeChat).name}
                                    {isAISelected && <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold uppercase">Smart Agent</span>}
                                </div>
                                {activeChat && activeChat.type === 'GROUP' && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {activeChat.participantIds.length} members
                                    </p>
                                )}
                                {isAISelected && (
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 animate-pulse">
                                        {isAiTyping ? 'Processing Workflow...' : 'Always Online'}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-1 md:gap-3 text-slate-400 dark:text-slate-500">
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><Phone className="w-5 h-5" /></button>
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><Video className="w-5 h-5" /></button>
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><MoreVertical className="w-5 h-5" /></button>
                        </div>
                    </div>

                    {/* Messages Feed */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
                        {isAISelected && activeMessages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-70">
                                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                                    <Bot className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Agentic AI Ready</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-6">
                                    I can check schedules, predict revenue, and manage your business.<br/><br/>
                                    Try: <em>"What is the projected revenue for this week?"</em>
                                </p>
                                <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                                    {['Projected revenue?', 'Is Marcus free tomorrow?', 'Check stock for Towels', 'Create a new job'].map((suggestion, i) => (
                                        <button key={i} onClick={() => setMessageInput(suggestion)} className="text-xs border border-slate-200 dark:border-slate-700 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300">
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeMessages.map((msg, idx) => {
                            const isMe = msg.senderId === currentUser.id;
                            const isAi = msg.senderId === 'ai-bot';
                            const sender = isAi ? { name: 'Gemini', avatarUrl: null } : users.find(u => u.id === msg.senderId);
                            const showAvatar = idx === 0 || activeMessages[idx - 1].senderId !== msg.senderId;

                            return (
                                <div key={msg.id} className={`flex gap-2 md:gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                    <div className="w-8 flex-shrink-0 flex flex-col items-center">
                                        {!isMe && showAvatar && (
                                            isAi ? (
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm">
                                                    <Bot className="w-5 h-5" />
                                                </div>
                                            ) : (
                                                <img src={sender?.avatarUrl} className="w-8 h-8 rounded-full shadow-sm border border-slate-200 dark:border-slate-700" title={sender?.name} alt="" />
                                            )
                                        )}
                                    </div>
                                    <div className={`max-w-[85%] md:max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                        {!isMe && showAvatar && !isAi && activeChat?.type === 'GROUP' && (
                                            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1 mb-1">{sender?.name}</span>
                                        )}
                                        <div 
                                            className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm whitespace-pre-wrap ${
                                                isMe 
                                                ? 'bg-emerald-600 text-white rounded-tr-sm' 
                                                : isAi
                                                    ? 'bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/50 text-slate-800 dark:text-slate-200 rounded-tl-sm shadow-indigo-500/5'
                                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                                            }`}
                                        >
                                            {isAi ? <RichMessage content={msg.content} /> : msg.content}
                                        </div>
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 mx-1">
                                            {format(new Date(msg.timestamp), 'h:mm a')}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        {isAiTyping && (
                            <div className="flex gap-3">
                                <div className="w-8 flex-shrink-0">
                                     <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm">
                                        <Bot className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/50 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 md:p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 sticky bottom-0">
                        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                            <button type="button" className="p-2 md:p-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                                <Paperclip className="w-5 h-5" />
                            </button>
                            <div className={`flex-1 bg-slate-100 dark:bg-slate-700/50 rounded-2xl flex items-center px-3 py-2 border border-transparent transition-all ${isAISelected ? 'focus-within:border-indigo-300 dark:focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900/30' : 'focus-within:border-emerald-300 dark:focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 dark:focus-within:ring-emerald-900/30'}`}>
                                <input 
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder={isAISelected ? "Ask me anything..." : "Type a message..."}
                                    className="flex-1 bg-transparent outline-none text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                                />
                                <button type="button" className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                    <Smile className="w-5 h-5" />
                                </button>
                            </div>
                            <button 
                                type="submit"
                                disabled={!messageInput.trim()}
                                className={`p-3 text-white rounded-full shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none ${isAISelected ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'}`}
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50/30 dark:bg-slate-900/30">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <MessageSquare className="w-10 h-10 opacity-30 text-slate-500 dark:text-slate-400" />
                    </div>
                    <p className="font-medium text-lg text-slate-600 dark:text-slate-300">Select a chat to start messaging</p>
                    <p className="text-sm mt-2 max-w-xs text-center">Coordinate with your team, share updates, and keep jobs moving efficiently.</p>
                </div>
            )}
        </div>

        {/* Create Group Modal */}
        <Modal
            isOpen={isGroupModalOpen}
            onClose={() => setIsGroupModalOpen(false)}
            title="Create New Group"
            footer={
                <>
                    <Button variant="ghost" onClick={() => setIsGroupModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateGroup} disabled={!groupName || selectedMembers.length === 0}>Create Group</Button>
                </>
            }
        >
            <div className="space-y-4 p-2">
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Group Name</label>
                    <input 
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="e.g. Management Team"
                        className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Select Members</label>
                    <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-600 rounded-lg divide-y divide-slate-100 dark:divide-slate-700 custom-scrollbar">
                        {users.filter(u => u.id !== currentUser.id).map(user => (
                            <div 
                                key={user.id} 
                                onClick={() => toggleMemberSelection(user.id)}
                                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${selectedMembers.includes(user.id) ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}
                            >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedMembers.includes(user.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                                    {selectedMembers.includes(user.id) && <Users className="w-3 h-3 text-white" />}
                                </div>
                                <img src={user.avatarUrl} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-600" alt="" />
                                <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">{user.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    </div>
  );
};
