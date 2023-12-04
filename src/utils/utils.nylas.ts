import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Nylas from 'nylas';
const { default: Folder } = require('nylas/lib/models/folder');
const { default: Draft } = require('nylas/lib/models/draft');

@Injectable()
export class NylasService {
    private nylas: any;
    constructor(private readonly configService: ConfigService) {
        this.nylas = Nylas.config({
            clientId: this.configService.get('NYLAS_CLIENT_ID'),
            clientSecret: this.configService.get('NYLAS_CLIENT_SECRET'),
        });
    }

    async getConnectedAccounts() {
        const accounts = await this.nylas.accounts.list();
        // for (let account of accounts) {
        //     console.log(
        //         `Email: ${account.emailAddress} | `,
        //         `Billing State: ${account.billingState} | `,
        //         `Sync State: ${account.syncState}`,
        //         `ID: ${account.id}  | `
        //     );
        // }
        return accounts;
    }

    async viewLabelsAndFolders() {
        let accountLabels, accountFolders;
        const account = await this.nylas.account.get();

        if (account.organizationUnit == 'label')
            accountLabels = await this.nylas.labels.list({});
        else
            accountFolders = await this.nylas.folders.list({});

        return { account, accountLabels, accountFolders };
    }

    async moveMostRecentThreadToFolder(folder) {
        const thread = await this.nylas.threads.first();
        // Add the folder to the most recent email and save it.
        // thread.folders = this.folderToUpdate;
        // thread.save().then(savedThread => {
        // console.log(`Subject: ${savedThread.subject}`);
        // console.log(`The most recent email has been moved to ${folder.displayName}`)
        // console.log(savedThread.folders);
        // })
        thread.folders = folder;
        thread.save();
    }

    async createFolder(folderName: string) {
        const folderExist = this.nylas.folders.find(folder => folder.displayName === folderName);
        if (folderExist) {
            this.moveMostRecentThreadToFolder(folderExist);
            return folderExist;
        }
        else {
            const newFolder = new Folder(this.nylas, { displayName: folderName });
            const savedFolder = await newFolder.save();
            this.moveMostRecentThreadToFolder(savedFolder);
            return newFolder;
        }
    }

    async getMostRecentMessage() {
        const message = await this.nylas.messages.first({ in: 'inbox' });

        return { data: message };
    }

    async getAllMessages() {
        const messages = await this.nylas.messages;

        return { data: messages };
    }

    async getThreads(limit: number) {
        const threads = await this.nylas.threads.list({ unread: true, limit });

        return { data: threads };
    }

    // This will send the message to specified users
    async createDraft(subject: string, body: string, to) {
        const draft = new Draft(this.nylas, {
            // subject: 'With Love, from Nylas',
            // body: 'This email was sent using the Nylas email API. Visit https://nylas.com for details.',
            // to: [{ name: 'My Nylas Friend', email: 'swag@nylas.com' }]
            subject,
            body,
            to
        });

        const message = await draft.send();

        return { data: message };
    }
}
