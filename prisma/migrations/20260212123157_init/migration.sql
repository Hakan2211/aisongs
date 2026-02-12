-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'user',
    "stripeCustomerId" TEXT,
    "subscriptionStatus" TEXT,
    "subscriptionTier" TEXT,
    "subscriptionPeriodEnd" DATETIME,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "hasPlatformAccess" BOOLEAN NOT NULL DEFAULT false,
    "platformPurchaseDate" DATETIME,
    "platformStripePaymentId" TEXT,
    "falApiKey" TEXT,
    "falApiKeyLastFour" TEXT,
    "falApiKeyAddedAt" DATETIME,
    "minimaxApiKey" TEXT,
    "minimaxApiKeyLastFour" TEXT,
    "minimaxApiKeyAddedAt" DATETIME,
    "bunnyApiKey" TEXT,
    "bunnyApiKeyLastFour" TEXT,
    "bunnyApiKeyAddedAt" DATETIME,
    "bunnyStorageZone" TEXT,
    "bunnyPullZone" TEXT,
    "replicateApiKey" TEXT,
    "replicateApiKeyLastFour" TEXT,
    "replicateApiKeyAddedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "accessTokenExpiresAt" DATETIME,
    "refreshTokenExpiresAt" DATETIME,
    "scope" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "subscription_event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "fromTier" TEXT,
    "toTier" TEXT,
    "metadata" TEXT,
    "stripeEventId" TEXT,
    "stripeSubscriptionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subscription_event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "music_generation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "prompt" TEXT NOT NULL,
    "lyrics" TEXT,
    "durationMs" INTEGER,
    "outputFormat" TEXT,
    "settings" TEXT,
    "audioUrl" TEXT,
    "originalAudioUrl" TEXT,
    "audioStored" BOOLEAN NOT NULL DEFAULT false,
    "audioDurationMs" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "requestId" TEXT,
    "statusUrl" TEXT,
    "responseUrl" TEXT,
    "cancelUrl" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "music_generation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "voice_clone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "provider" TEXT NOT NULL,
    "minimaxVoiceId" TEXT,
    "speakerEmbeddingUrl" TEXT,
    "referenceText" TEXT,
    "sourceAudioUrl" TEXT NOT NULL,
    "sourceAudioStored" BOOLEAN NOT NULL DEFAULT false,
    "previewAudioUrl" TEXT,
    "rvcModelUrl" TEXT,
    "rvcModelStatus" TEXT,
    "rvcRequestId" TEXT,
    "rvcError" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "requestId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "voice_clone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "voice_conversion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "sourceAudioUrl" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceGenerationId" TEXT,
    "sourceVoiceCloneId" TEXT,
    "targetSinger" TEXT,
    "rvcModelUrl" TEXT,
    "rvcModelName" TEXT,
    "pitchShift" INTEGER,
    "indexRate" REAL,
    "filterRadius" INTEGER,
    "outputAudioUrl" TEXT,
    "outputAudioStored" BOOLEAN NOT NULL DEFAULT false,
    "audioDurationMs" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "requestId" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "voice_conversion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "voice_conversion_sourceGenerationId_fkey" FOREIGN KEY ("sourceGenerationId") REFERENCES "music_generation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "voice_conversion_sourceVoiceCloneId_fkey" FOREIGN KEY ("sourceVoiceCloneId") REFERENCES "voice_clone" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "subscription_event_userId_idx" ON "subscription_event"("userId");

-- CreateIndex
CREATE INDEX "subscription_event_event_idx" ON "subscription_event"("event");

-- CreateIndex
CREATE INDEX "subscription_event_createdAt_idx" ON "subscription_event"("createdAt");

-- CreateIndex
CREATE INDEX "music_generation_userId_idx" ON "music_generation"("userId");

-- CreateIndex
CREATE INDEX "music_generation_status_idx" ON "music_generation"("status");

-- CreateIndex
CREATE INDEX "music_generation_provider_idx" ON "music_generation"("provider");

-- CreateIndex
CREATE INDEX "music_generation_createdAt_idx" ON "music_generation"("createdAt");

-- CreateIndex
CREATE INDEX "voice_clone_userId_idx" ON "voice_clone"("userId");

-- CreateIndex
CREATE INDEX "voice_clone_status_idx" ON "voice_clone"("status");

-- CreateIndex
CREATE INDEX "voice_conversion_userId_idx" ON "voice_conversion"("userId");

-- CreateIndex
CREATE INDEX "voice_conversion_status_idx" ON "voice_conversion"("status");

-- CreateIndex
CREATE INDEX "voice_conversion_sourceGenerationId_idx" ON "voice_conversion"("sourceGenerationId");

-- CreateIndex
CREATE INDEX "voice_conversion_sourceVoiceCloneId_idx" ON "voice_conversion"("sourceVoiceCloneId");
