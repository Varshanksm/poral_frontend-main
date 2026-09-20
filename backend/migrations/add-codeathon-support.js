/**
 * Database Migration Script
 * Purpose: Update indexes to support Codeathon feature
 * 
 * This script:
 * 1. Drops old unique indexes that might conflict
 * 2. Creates new compound unique index for student+title+year
 * 3. Ensures eventType field exists with default value
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function migrateDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hackathon-portal');
        console.log('  Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('hackathons');

        // Step 1: Check existing indexes
        console.log('\n📋 Current indexes:');
        const indexes = await collection.indexes();
        indexes.forEach(index => {
            console.log(`  - ${index.name}:`, JSON.stringify(index.key));
        });

        // Step 2: Drop problematic unique indexes if they exist
        console.log('\n🗑️  Dropping old unique indexes...');
        try {
            // Try to drop old unique index on hackathonTitle + year if it exists
            await collection.dropIndex('hackathonTitle_1_year_1');
            console.log('    Dropped hackathonTitle_1_year_1 index');
        } catch (err) {
            if (err.code === 27) {
                console.log('  ℹ️  Index hackathonTitle_1_year_1 does not exist (OK)');
            } else {
                console.log('  ⚠️  Error dropping index:', err.message);
            }
        }

        // Step 3: Ensure compound unique index exists
        console.log('\n🔧 Creating compound unique index...');
        try {
            await collection.createIndex(
                { studentId: 1, hackathonTitle: 1, year: 1 },
                { unique: true, name: 'student_hackathon_year_unique' }
            );
            console.log('    Created compound unique index: studentId + hackathonTitle + year');
        } catch (err) {
            if (err.code === 85 || err.code === 86) {
                console.log('  ℹ️  Index already exists (OK)');
            } else {
                console.log('  ⚠️  Error creating index:', err.message);
            }
        }

        // Step 4: Update documents without eventType field
        console.log('\n📝 Updating documents without eventType...');
        const result = await collection.updateMany(
            { eventType: { $exists: false } },
            { $set: { eventType: 'Hackathon' } }
        );
        console.log(`    Updated ${result.modifiedCount} documents with default eventType='Hackathon'`);

        // Step 5: Verify final state
        console.log('\n📋 Final indexes:');
        const finalIndexes = await collection.indexes();
        finalIndexes.forEach(index => {
            console.log(`  - ${index.name}:`, JSON.stringify(index.key), index.unique ? '(UNIQUE)' : '');
        });

        // Step 6: Count documents by eventType
        console.log('\n📊 Document counts by eventType:');
        const hackathonCount = await collection.countDocuments({ eventType: 'Hackathon' });
        const codeathonCount = await collection.countDocuments({ eventType: 'Codeathon' });
        const noTypeCount = await collection.countDocuments({ eventType: { $exists: false } });
        console.log(`  - Hackathons: ${hackathonCount}`);
        console.log(`  - Codeathons: ${codeathonCount}`);
        console.log(`  - No eventType: ${noTypeCount}`);

        console.log('\n  Migration completed successfully!');
        console.log('\n💡 Next steps:');
        console.log('  1. Restart your backend server');
        console.log('  2. Try submitting a Codeathon again');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run migration
migrateDatabase()
    .then(() => {
        console.log('\n🎉 All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Fatal error:', error);
        process.exit(1);
    });
