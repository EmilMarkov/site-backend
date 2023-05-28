import express from 'express';
import cors from 'cors';
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

export const app = express();

app.use(cors({ origin: true }));

app.use(express.json());
app.use(express.raw({ type: 'application/vnd.custom-type' }));
app.use(express.text({ type: 'text/html' }));

app.get('/', (req, res) => {
	res.status(200).send({ status: 'ok' });
});

const api = express.Router();

const uri = 'mongodb://mongo:SXo216P8OZjWL3ERi3Pq@containers-us-west-60.railway.app:6502';

const dbName = 'test';
const feedbackCollectionName = 'feedback';
const userCollectionName = 'users';


const client = new MongoClient(uri);
let db: Db;
let feedbackCollection: Collection;
let userCollection: Collection;

try {
	await client.connect();
	console.log('Connected to the database');
	db = client.db(dbName);
	feedbackCollection = db.collection(feedbackCollectionName);
	userCollection = db.collection(userCollectionName);
} catch (err) {
	console.error('Failed to connect to the database:', err);
	process.exit(1);
}

app.post('/getmessages', async (req, res) => {
	const { _id } = req.body;
  
	try {
		const userId = new ObjectId(_id);
    		const messages = await userCollection.findOne({ _id: userId });

		res.status(200).json(messages);
	} catch (err) {
		console.error('Failed to find user:', err);
		res.sendStatus(500);
	}
});

app.post('/postmessages', async (req, res) => {
	const { _id, message } = req.body;

	console.log(_id, message);
  
	try {
		const userId = new ObjectId(_id);
		const update = { $set: { messages: message } };

		const messages = await userCollection.updateOne({ _id: userId }, update);

    	console.log(`${messages.modifiedCount} document(s) updated`);

		res.sendStatus(200);
	} catch (err) {
		console.error('Failed to authenticate user:', err);
		res.sendStatus(500);
	}
});

app.post('/feedback', (req, res) => {
	const { firstName, lastName, email, topic, message } = req.body;

	feedbackCollection.insertOne({ firstName, lastName, email, topic, message })
	.then(() => {
		res.sendStatus(200);
	})
	.catch((err) => {
		console.error('Failed to insert feedback:', err);
		res.sendStatus(500);
	});
});

app.post('/login', async (req, res) => {
	const { email, password } = req.body;
  
	try {
		const user = await userCollection.findOne({ email: email });
		const firstname = user.firstname;
		const lastname = user.lastname;
		const messages = user.messages;
	
		if (user.password === password) {
			const existingUser = {
				_id: user._id,
				firstname: firstname,
				lastname: lastname,
                email: email,
                password: password,
                messages: messages
            };

            res.status(200).json(existingUser);
		} else {
			res.sendStatus(401);
		}
	} catch (err) {
		console.error('Failed to authenticate user:', err);
		res.sendStatus(500);
	}
});
  
app.post('/register', async (req, res) => {
    const { firstname, lastname, email, password } = req.body;

    try {
        const existingUser = await userCollection.findOne({ email: email });

        if (existingUser != null) {
            res.sendStatus(409);
        } else {

			let newUser = {
				firstname: firstname,
				lastname: lastname,
				email: email,
				password: password,
				messages: []
			};
			  
            const messages = await userCollection.insertOne(newUser);

            const userId = messages.insertedId;
			let data = {
				_id: userId,
				firstname: newUser.lastname,
				lastname: newUser.lastname,
				email: newUser.email,
				password: newUser.password,
				messages: newUser.messages
			}

            res.status(200).json(data);
        }
    } catch (err) {
        console.error('Failed to register user:', err);
        res.sendStatus(500);
    }
});



app.post('/update', (req, res) => {
	const { _id, firstname, lastname, email, password, messages } = req.body;
  
	try {
		const updateFields = {
			firstname: firstname,
			lastname: lastname,
			email: email,
			password: password,
			messages: messages
		};

		const userId = new ObjectId(_id);
		  
		userCollection.updateOne({ _id: userId }, { $set: updateFields })
		.then(() => {
			console.log('Документ успешно обновлен');
		})
		.catch(error => {
			console.error('Ошибка при обновлении документа:', error);
		});
		  

		res.sendStatus(200);
	} catch (err) {
		console.error('Failed to update data:', err);
		res.sendStatus(500);
	}
});

app.use('/api/v1', api);
