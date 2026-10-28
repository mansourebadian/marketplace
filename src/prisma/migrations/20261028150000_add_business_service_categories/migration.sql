BEGIN TRY
BEGIN TRAN;
CREATE TABLE [dbo].[BusinessServiceCategory] (
    [id] NVARCHAR(36) NOT NULL,
    [businessId] NVARCHAR(36) NOT NULL,
    [name] NVARCHAR(100) NOT NULL,
    [color] NVARCHAR(20) NOT NULL,
    [description] NVARCHAR(255),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [BusinessServiceCategory_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [BusinessServiceCategory_pkey] PRIMARY KEY CLUSTERED ([id])
);
CREATE NONCLUSTERED INDEX [BusinessServiceCategory_businessId_idx] ON [dbo].[BusinessServiceCategory]([businessId]);
ALTER TABLE [dbo].[BusinessServiceCategory] ADD CONSTRAINT [BusinessServiceCategory_businessId_fkey] FOREIGN KEY ([businessId]) REFERENCES [dbo].[Business]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;
COMMIT TRAN;
END TRY
BEGIN CATCH
IF @@TRANCOUNT > 0 ROLLBACK TRAN;
THROW;
END CATCH
