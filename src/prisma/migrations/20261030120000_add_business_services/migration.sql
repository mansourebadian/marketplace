BEGIN TRY
BEGIN TRAN;
CREATE TABLE [dbo].[BusinessService] (
    [id] NVARCHAR(36) NOT NULL,
    [businessId] NVARCHAR(36) NOT NULL,
    [categoryKey] NVARCHAR(72) NOT NULL,
    [name] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(1000),
    [treatmentId] NVARCHAR(36),
    [price] INT NOT NULL,
    [durationMin] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [BusinessService_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [BusinessService_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [BusinessService_price_check] CHECK ([price] >= 0),
    CONSTRAINT [BusinessService_duration_check] CHECK ([durationMin] > 0)
);
CREATE NONCLUSTERED INDEX [BusinessService_businessId_categoryKey_idx] ON [dbo].[BusinessService]([businessId], [categoryKey]);
ALTER TABLE [dbo].[BusinessService] ADD CONSTRAINT [BusinessService_businessId_fkey] FOREIGN KEY ([businessId]) REFERENCES [dbo].[Business]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;
COMMIT TRAN;
END TRY
BEGIN CATCH
IF @@TRANCOUNT > 0 ROLLBACK TRAN;
THROW;
END CATCH
