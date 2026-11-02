BEGIN TRY
BEGIN TRAN;
CREATE TABLE [dbo].[BusinessBundle] (
    [id] NVARCHAR(36) NOT NULL,
    [businessId] NVARCHAR(36) NOT NULL,
    [categoryKey] NVARCHAR(72) NOT NULL,
    [name] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(1000),
    [scheduleType] NVARCHAR(16) NOT NULL,
    [priceType] NVARCHAR(16) NOT NULL,
    [price] INT NOT NULL,
    [discount] INT,
    [onlineBooking] BIT NOT NULL CONSTRAINT [BusinessBundle_onlineBooking_df] DEFAULT 1,
    [availability] NVARCHAR(16) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [BusinessBundle_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [BusinessBundle_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [BusinessBundle_price_check] CHECK ([price] >= 0),
    CONSTRAINT [BusinessBundle_discount_check] CHECK ([discount] IS NULL OR [discount] BETWEEN 0 AND 100)
);
CREATE TABLE [dbo].[BusinessBundleItem] (
    [id] NVARCHAR(36) NOT NULL,
    [bundleId] NVARCHAR(36) NOT NULL,
    [serviceId] NVARCHAR(36) NOT NULL,
    [position] INT NOT NULL,
    CONSTRAINT [BusinessBundleItem_pkey] PRIMARY KEY CLUSTERED ([id])
);
CREATE TABLE [dbo].[BusinessBundleImage] (
    [id] NVARCHAR(36) NOT NULL,
    [bundleId] NVARCHAR(36) NOT NULL,
    [url] NVARCHAR(2048) NOT NULL,
    [position] INT NOT NULL,
    CONSTRAINT [BusinessBundleImage_pkey] PRIMARY KEY CLUSTERED ([id])
);
CREATE NONCLUSTERED INDEX [BusinessBundle_businessId_categoryKey_idx] ON [dbo].[BusinessBundle]([businessId], [categoryKey]);
CREATE UNIQUE NONCLUSTERED INDEX [BusinessBundleItem_bundleId_serviceId_key] ON [dbo].[BusinessBundleItem]([bundleId], [serviceId]);
CREATE UNIQUE NONCLUSTERED INDEX [BusinessBundleItem_bundleId_position_key] ON [dbo].[BusinessBundleItem]([bundleId], [position]);
CREATE UNIQUE NONCLUSTERED INDEX [BusinessBundleImage_bundleId_position_key] ON [dbo].[BusinessBundleImage]([bundleId], [position]);
ALTER TABLE [dbo].[BusinessBundle] ADD CONSTRAINT [BusinessBundle_businessId_fkey] FOREIGN KEY ([businessId]) REFERENCES [dbo].[Business]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE [dbo].[BusinessBundleItem] ADD CONSTRAINT [BusinessBundleItem_bundleId_fkey] FOREIGN KEY ([bundleId]) REFERENCES [dbo].[BusinessBundle]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE [dbo].[BusinessBundleItem] ADD CONSTRAINT [BusinessBundleItem_serviceId_fkey] FOREIGN KEY ([serviceId]) REFERENCES [dbo].[BusinessService]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[BusinessBundleImage] ADD CONSTRAINT [BusinessBundleImage_bundleId_fkey] FOREIGN KEY ([bundleId]) REFERENCES [dbo].[BusinessBundle]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;
COMMIT TRAN;
END TRY
BEGIN CATCH
IF @@TRANCOUNT > 0 ROLLBACK TRAN;
THROW;
END CATCH
