import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function debugScouting() {
  console.log('🔍 Debugging Scouting Data...\n');

  try {
    // 1. Check what teams are in the database
    console.log('1. Checking scouting_overview table...');
    const { data: allScouting, error: queryError } = await supabase
      .from('scouting_overview')
      .select('team_id, team_name')
      .order('team_id');

    if (queryError) {
      console.error('❌ Error querying scouting_overview:', queryError);
      return;
    }

    if (!allScouting || allScouting.length === 0) {
      console.log('⚠️  No scouting data found in database!');
      console.log('   Run the SQL from DebugTools.tsx to seed the data.');
      return;
    }

    console.log(`✅ Found ${allScouting.length} teams in database:`);
    allScouting.forEach(item => {
      console.log(`   - ${item.team_id}: ${item.team_name}`);
    });

    // 2. Test fetching specific teams
    console.log('\n2. Testing fetchScoutingOverview function...');
    const testTeams = ['ARG', 'FRA', 'USA', 'ENG', 'BRA', 'NED', 'GER', 'ESP'];
    
    for (const teamId of testTeams) {
      const { data, error } = await supabase
        .from('scouting_overview')
        .select('*')
        .eq('team_id', teamId)
        .maybeSingle();

      if (error) {
        console.log(`   ❌ ${teamId}: Error - ${error.message}`);
      } else if (data) {
        console.log(`   ✅ ${teamId}: Found - ${data.team_name} (Rank: ${data.fifa_rank})`);
      } else {
        console.log(`   ⚠️  ${teamId}: Not found in database`);
      }
    }

    // 3. Check for case sensitivity issues
    console.log('\n3. Checking for case sensitivity issues...');
    const { data: caseTest } = await supabase
      .from('scouting_overview')
      .select('team_id')
      .ilike('team_id', 'arg'); // Case-insensitive search
    
    if (caseTest && caseTest.length > 0) {
      console.log(`   Found ${caseTest.length} matches with case-insensitive search`);
      console.log(`   Actual values: ${caseTest.map(t => t.team_id).join(', ')}`);
    }

    // 4. Check RLS policies
    console.log('\n4. Checking RLS policies...');
    const { data: policyCheck } = await supabase
      .from('scouting_overview')
      .select('*')
      .limit(1);
    
    if (policyCheck) {
      console.log('   ✅ RLS allows reading (using service key)');
    } else {
      console.log('   ⚠️  RLS might be blocking reads');
    }

    // 5. Full data sample
    console.log('\n5. Sample full record for ARG:');
    const { data: argData } = await supabase
      .from('scouting_overview')
      .select('*')
      .eq('team_id', 'ARG')
      .single();
    
    if (argData) {
      console.log(JSON.stringify(argData, null, 2));
    } else {
      console.log('   No data found for ARG');
    }

  } catch (err) {
    console.error('Critical Error:', err);
  }
}

debugScouting();
