BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Service] ADD [categoryId] NVARCHAR(1000);

-- CreateTable
CREATE TABLE [dbo].[ServiceCategory] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [icon] NVARCHAR(1000) NOT NULL,
    [order] INT NOT NULL CONSTRAINT [ServiceCategory_order_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ServiceCategory_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ServiceCategory_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ServiceCategory_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- AddForeignKey
ALTER TABLE [dbo].[Service] ADD CONSTRAINT [Service_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[ServiceCategory]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
