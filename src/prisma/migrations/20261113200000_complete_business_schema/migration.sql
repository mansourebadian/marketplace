BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Business] ADD [bale] NVARCHAR(255),
[clientLanguage] NVARCHAR(32),
[instagram] NVARCHAR(255),
[rubika] NVARCHAR(255),
[taxMode] NVARCHAR(16) CONSTRAINT [Business_taxMode_df] DEFAULT 'include',
[teamLanguage] NVARCHAR(32);

-- AlterTable
ALTER TABLE [dbo].[BusinessCategorySelection] DROP CONSTRAINT [BusinessCategorySelection_color_df];
ALTER TABLE [dbo].[BusinessCategorySelection] ADD CONSTRAINT [BusinessCategorySelection_color_df] DEFAULT 'blue' FOR [color];

-- AlterTable
ALTER TABLE [dbo].[BusinessService] DROP CONSTRAINT [BusinessService_advancedPricing_df],
[BusinessService_extraTimes_df],
[BusinessService_priceType_df],
[BusinessService_variants_df];
ALTER TABLE [dbo].[BusinessService] ADD CONSTRAINT [BusinessService_advancedPricing_df] DEFAULT '[]' FOR [advancedPricing], CONSTRAINT [BusinessService_extraTimes_df] DEFAULT '[]' FOR [extraTimes], CONSTRAINT [BusinessService_priceType_df] DEFAULT 'FIXED' FOR [priceType], CONSTRAINT [BusinessService_variants_df] DEFAULT '[]' FOR [variants];

-- CreateTable
CREATE TABLE [dbo].[BusinessLocation] (
    [id] NVARCHAR(36) NOT NULL,
    [businessId] NVARCHAR(36) NOT NULL,
    [name] NVARCHAR(60) NOT NULL,
    [internalName] NVARCHAR(60),
    [phone] NVARCHAR(32),
    [email] NVARCHAR(320),
    [address] NVARCHAR(300),
    [noFixedAddress] BIT NOT NULL CONSTRAINT [BusinessLocation_noFixedAddress_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [BusinessLocation_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [BusinessLocation_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[LocationOpeningHour] (
    [id] NVARCHAR(36) NOT NULL,
    [locationId] NVARCHAR(36) NOT NULL,
    [day] INT NOT NULL,
    [enabled] BIT NOT NULL CONSTRAINT [LocationOpeningHour_enabled_df] DEFAULT 1,
    [opensAt] NVARCHAR(5) NOT NULL,
    [closesAt] NVARCHAR(5) NOT NULL,
    CONSTRAINT [LocationOpeningHour_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [LocationOpeningHour_locationId_day_key] UNIQUE NONCLUSTERED ([locationId],[day])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BusinessLocation_businessId_idx] ON [dbo].[BusinessLocation]([businessId]);

-- AddForeignKey
ALTER TABLE [dbo].[BusinessLocation] ADD CONSTRAINT [BusinessLocation_businessId_fkey] FOREIGN KEY ([businessId]) REFERENCES [dbo].[Business]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[LocationOpeningHour] ADD CONSTRAINT [LocationOpeningHour_locationId_fkey] FOREIGN KEY ([locationId]) REFERENCES [dbo].[BusinessLocation]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

