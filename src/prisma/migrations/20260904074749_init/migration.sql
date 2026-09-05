BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(1000) NOT NULL,
    [phone] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'CUSTOMER',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_phone_key] UNIQUE NONCLUSTERED ([phone])
);

-- CreateTable
CREATE TABLE [dbo].[Salon] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [address] NVARCHAR(1000) NOT NULL,
    [lat] FLOAT(53) NOT NULL,
    [lng] FLOAT(53) NOT NULL,
    [description] NVARCHAR(1000),
    [imageUrl] NVARCHAR(1000),
    [priceRange] NVARCHAR(1000),
    [rating] FLOAT(53) CONSTRAINT [Salon_rating_df] DEFAULT 0,
    [reviewsCount] INT CONSTRAINT [Salon_reviewsCount_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Salon_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Salon_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Service] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [price] INT NOT NULL,
    [durationMin] INT NOT NULL,
    [salonId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Service_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[TeamMember] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL,
    [avatarUrl] NVARCHAR(1000),
    [salonId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [TeamMember_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Booking] (
    [id] NVARCHAR(1000) NOT NULL,
    [date] DATETIME2 NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Booking_status_df] DEFAULT 'PENDING',
    [userId] NVARCHAR(1000) NOT NULL,
    [salonId] NVARCHAR(1000) NOT NULL,
    [serviceId] NVARCHAR(1000) NOT NULL,
    [teamMemberId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Booking_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Review] (
    [id] NVARCHAR(1000) NOT NULL,
    [rating] INT NOT NULL,
    [comment] NVARCHAR(1000),
    [date] DATETIME2 NOT NULL CONSTRAINT [Review_date_df] DEFAULT CURRENT_TIMESTAMP,
    [userId] NVARCHAR(1000) NOT NULL,
    [salonId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Review_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Portfolio] (
    [id] NVARCHAR(1000) NOT NULL,
    [imageUrl] NVARCHAR(1000) NOT NULL,
    [caption] NVARCHAR(1000),
    [order] INT NOT NULL CONSTRAINT [Portfolio_order_df] DEFAULT 0,
    [salonId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Portfolio_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Portfolio_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Service] ADD CONSTRAINT [Service_salonId_fkey] FOREIGN KEY ([salonId]) REFERENCES [dbo].[Salon]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TeamMember] ADD CONSTRAINT [TeamMember_salonId_fkey] FOREIGN KEY ([salonId]) REFERENCES [dbo].[Salon]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Booking] ADD CONSTRAINT [Booking_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Booking] ADD CONSTRAINT [Booking_salonId_fkey] FOREIGN KEY ([salonId]) REFERENCES [dbo].[Salon]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Booking] ADD CONSTRAINT [Booking_serviceId_fkey] FOREIGN KEY ([serviceId]) REFERENCES [dbo].[Service]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Booking] ADD CONSTRAINT [Booking_teamMemberId_fkey] FOREIGN KEY ([teamMemberId]) REFERENCES [dbo].[TeamMember]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Review] ADD CONSTRAINT [Review_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Review] ADD CONSTRAINT [Review_salonId_fkey] FOREIGN KEY ([salonId]) REFERENCES [dbo].[Salon]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Portfolio] ADD CONSTRAINT [Portfolio_salonId_fkey] FOREIGN KEY ([salonId]) REFERENCES [dbo].[Salon]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
