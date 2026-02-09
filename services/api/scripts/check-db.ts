import 'dotenv/config';
import { db, chats, projects } from '@ai-chat/database';
import { eq } from 'drizzle-orm';

async function checkDatabase() {
  try {
    console.log('🔍 Checking database...\n');

    // Check projects
    const allProjects = await db.select().from(projects);
    console.log(`📁 Total projects: ${allProjects.length}`);
    if (allProjects.length > 0) {
      console.log('\nProjects:');
      allProjects.forEach(p => {
        console.log(`  - ${p.id.slice(0, 8)}: "${p.name}" (user: ${p.userId.slice(0, 8)})`);
      });
    }

    // Check chats
    const allChats = await db.select().from(chats);
    console.log(`\n💬 Total chats: ${allChats.length}`);
    if (allChats.length > 0) {
      console.log('\nChats:');
      allChats.forEach(c => {
        const projectId = c.projectId ? c.projectId.slice(0, 8) : 'none';
        console.log(`  - ${c.id.slice(0, 8)}: "${c.title}" (project: ${projectId})`);
      });
    }

    // Check chats with projects
    console.log('\n🔗 Checking chat-project relationships:');
    const chatsWithProjects = allChats.filter(c => c.projectId);
    console.log(`Chats with projectId: ${chatsWithProjects.length}/${allChats.length}`);

    for (const chat of chatsWithProjects) {
      const project = allProjects.find(p => p.id === chat.projectId);
      if (project) {
        console.log(`  ✅ Chat "${chat.title}" → Project "${project.name}"`);
      } else {
        console.log(`  ❌ Chat "${chat.title}" → Project ${chat.projectId?.slice(0, 8)} (NOT FOUND)`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDatabase();
