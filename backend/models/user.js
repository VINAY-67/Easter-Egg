const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        HashedPassword: {
            type: String,
            required: true,
        },
        HasPlayed: {
            'Round-1': { type: Boolean, default: false },
            'Round-2': { type: Boolean, default: false },
            'Round-3': { type: Boolean, default: false },
        },
        Scores: {
            'Round-1': { type: Number, default: 0 },
            'Round-2': { type: Number, default: 0 },
            'Round-3': { type: Number, default: 0 },
        },
        HasWon: { type: Boolean, default: false },
        HasStarted: { type: Boolean, default: false },
        Status: {
            type: String,
            enum: ['playing', 'won', 'lose', 'eliminated'],
            default: 'playing',
        },
        numberofTries: {
            'Round-1': { type: Number, default: 0, max: 3 },
            'Round-2': { type: Number, default: 0, max: 3 },
            'Round-3': { type: Number, default: 0, max: 3 },
        },
        isLocked: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Instance method – hash password before save
userSchema.methods.hashPassword = async function (plainPassword) {
    const salt = await bcrypt.genSalt(10);
    this.HashedPassword = await bcrypt.hash(plainPassword, salt);
};

// Instance method – verify password
userSchema.methods.matchPassword = async function (plainPassword) {
    return await bcrypt.compare(plainPassword, this.HashedPassword);
};

module.exports = mongoose.model('User', userSchema);
