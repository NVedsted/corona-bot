import {Client, ColorResolvable, Guild, Role, Snowflake, TextChannel} from 'discord.js'

const BOT_TOKEN = process.env['BOT_TOKEN'];

/**
 * The name used for the virus role.
 */
const ROLE_NAME = "COVID-19";

/**
 * The color of the role.
 */
const ROLE_COLOR: ColorResolvable = [255, 255, 0];

/**
 * How many are initially infected.
 */
const INITIAL_INFECTION = 0.05;

/**
 * The minimum amount of people initially infected.
 */
const MINIMUM_INFECTION = 2;

/**
 * The chance of being infected when in contact with someone.
 */
const INFECTION_CHANCE = 0.1;

/**
 * Discord Client for the bot.
 */
const client = new Client();

/**
 * The virus roles for guilds.
 */
const infectedRoles = new Map<Snowflake, Role>();

/**
 * Set up a role for the virus.
 * @param guild The guild to set up the virus role for.
 */
async function setupRole(guild: Guild) {
    const infectedRole = guild.roles.find(role => role.name == ROLE_NAME);

    if (!infectedRole) {
        // If the server has no role, create one.
        console.log(`Creating infected role for ${guild.name}...`);
        const newRole = await guild.createRole({
            name: ROLE_NAME,
            color: ROLE_COLOR,
            position: 99999
        });
        infectedRoles.set(guild.id, newRole);
    } else {
        infectedRoles.set(guild.id, infectedRole);
    }
}

/**
 * Ensures that a few individuals are infected on the guild.
 * @param guild The guild to ensure infection on.
 * @return Whether the infection succeeded.
 */
async function ensureInfection(guild: Guild) {
    const role = infectedRoles.get(guild.id);

    if (!role) {
        throw Error("No infection role.");
    }

    const infectionCount = role.members.size;
    const minimumInfected = Math.floor(Math.max(MINIMUM_INFECTION, guild.members.size * INITIAL_INFECTION));
    if (infectionCount < minimumInfected) {
        const toBeInfected = minimumInfected - infectionCount;
        await Promise.all(
            guild.members.random(toBeInfected)
                .map(member => member.addRole(role, `Initial infection of ${ROLE_NAME}.`))
        );
    }
}

/**
 * Sets up a guild for infection.
 * @param guild The guild to set up.
 */
async function setupGuild(guild: Guild) {
    try {
        await setupRole(guild);
        await ensureInfection(guild);
    } catch (e) {
        console.error(`Failed to start up guild ${guild.name}!`);
        console.error(e);
    }
}

/**
 * Ensures all guilds are set-up when the bot starts.
 */
client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    await Promise.all(client.guilds.map(setupGuild));
});

/**
 * Restarts the infection if someone decides to delete the role.
 */
client.on('roleDelete', async role => {
    const infectedRole = infectedRoles.get(role.guild.id);

    if (infectedRole && infectedRole.id == role.id) {
        console.log(`${role.guild.name} deleted the virus!`);
        infectedRoles.delete(role.guild.id);
        await setupGuild(role.guild);
    }
});

/**
 * Handles infection among messages.
 */
client.on('message', async message => {
    const infectionRole = infectedRoles.get(message.guild.id);
    if (!infectionRole) {
        return;
    }

    // Find the above message.
    const channel = message.channel as TextChannel;
    const aboveMessages = await channel.fetchMessages({
        limit: 1,
        before: message.id
    });
    if (aboveMessages.size > 0) {
        // Figure out who's infected.
        const member1 = message.member;
        const member1Infected = member1.roles.has(infectionRole.id);
        const member2 = aboveMessages.first().member;
        const member2Infected = member2.roles.has(infectionRole.id);

        // Do the infection if anyone is infected.
        if (member1Infected || member2Infected) {
            const infectionOccurs = Math.random() <= INFECTION_CHANCE;
            if (infectionOccurs) {
                if (!member1Infected) {
                    await member1.addRole(infectionRole, `Infected by ${member2.user.tag}`);
                }
                if (!member2Infected) {
                    await member2.addRole(infectionRole, `Infected by ${member1.user.tag}`);
                }
            }
        }
    }
});

/**
 * Forgets guilds that remove the bot.
 */
client.on('guildDelete', guild => infectedRoles.delete(guild.id));

/**
 * Set-up guilds that invite the bot.
 */
client.on('guildCreate', guild => setupGuild(guild));

client.login(BOT_TOKEN);
